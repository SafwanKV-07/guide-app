from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from models import db, Update, Subcategory, Category
from config import Config
from data_loader import load_data
from search import search_data, initialize_search_index
from datetime import datetime, timedelta
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import logging
import traceback
import os
import threading
from acronym_service import AcronymService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})
socketio = SocketIO(
    app, cors_allowed_origins="http://localhost:3000", async_mode="threading"
)
db.init_app(app)

excel_data_changed = False
data_initialized = False
acronym_service = AcronymService()


class ExcelHandler(FileSystemEventHandler):
    def on_modified(self, event):
        global excel_data_changed
        if event.src_path.endswith(".xlsx"):
            excel_data_changed = True
            logger.info("Excel file has been modified. Flag set for reload.")
            socketio.emit("excel_updated", {"message": "Excel file has been updated"})


def start_file_watcher(excel_file_path):
    if not os.path.exists(excel_file_path):
        logger.warning(f"Warning: Excel file not found at {excel_file_path}")
        return None

    directory = os.path.dirname(excel_file_path)
    if not directory:
        directory = "."  # Use current directory if no directory is specified

    event_handler = ExcelHandler()
    observer = Observer()
    observer.schedule(event_handler, path=directory, recursive=False)

    try:
        observer.start()
        logger.info(f"File watcher started for {excel_file_path}")
    except Exception as e:
        logger.error(f"Error starting file watcher: {e}")
        return None

    return observer


def check_and_reload_data():
    global excel_data_changed
    if excel_data_changed:
        logger.info("Reloading data from Excel...")
        with app.app_context():
            load_data(app)
            subcategories = Subcategory.query.all()
            initialize_search_index(subcategories)
        excel_data_changed = False
        logger.info("Data reload complete.")
        socketio.emit("data_reloaded", {"message": "Data has been reloaded"})


def initialize_data():
    global data_initialized
    if not data_initialized:
        with app.app_context():
            db.create_all()
            load_data(app)
            subcategories = Subcategory.query.all()
            initialize_search_index(subcategories)
        data_initialized = True
        logger.info("Data initialization complete.")


@socketio.on("connect")
def handle_connect():
    logger.info("Client connected")


@socketio.on("disconnect")
def handle_disconnect():
    logger.info("Client disconnected")


@app.before_request
def before_request():
    initialize_data()
    check_and_reload_data()


@app.route("/search", methods=["GET"])
def search():
    try:
        query = request.args.get("query", "").strip()
        logger.info(f"Received search query: {query}")

        if not query:
            return jsonify(
                {"exact": False, "message": "No query provided.", "matches": []}
            )

        results = search_data(query)

        acronym_matches = acronym_service.find_matches(query)

        response = {
            "exact": any(m["match_type"] == "Exact Match" for m in results),
            "message": "Showing results" if results else "No matches found.",
            "matches": results,
            "acronym_matches": acronym_matches,
        }

        logger.info(
            f"Returning {len(results)} results and {len(acronym_matches)} acronym matches"
        )
        return jsonify(response)

    except Exception as e:
        logger.error(f"An error occurred during search: {str(e)}")
        logger.error(traceback.format_exc())
        return (
            jsonify({"error": "An internal server error occurred", "details": str(e)}),
            500,
        )


@app.route("/updates", methods=["GET"])
def get_updates():
    try:
        # Get the 10 most recent updates by date
        recent_updates = (
            Update.query.order_by(Update.date.desc(), Update.id.desc()).limit(10).all()
        )

        # If there are less than 10 recent updates, get additional older updates
        if len(recent_updates) < 10:
            older_updates = (
                Update.query.order_by(Update.date.asc(), Update.id.asc())
                .limit(10 - len(recent_updates))
                .all()
            )
            updates = recent_updates + list(reversed(older_updates))
        else:
            updates = recent_updates

        current_time = datetime.utcnow()
        updates_data = [
            {
                "main_folder": update.main_folder,
                "category": update.category,
                "description": update.description,
                "new": (current_time - update.date) <= timedelta(days=1),
                "date": update.date.isoformat(),
            }
            for update in updates
        ]

        logger.info(f"Returning {len(updates_data)} updates")
        return jsonify(updates_data)

    except Exception as e:
        logger.error(f"An error occurred while fetching updates: {str(e)}")
        logger.error(traceback.format_exc())
        return (
            jsonify({"error": "An internal server error occurred", "details": str(e)}),
            500,
        )


@app.route("/api/acronyms/search", methods=["GET"])
def search_acronyms():
    query = request.args.get("query", "").strip()
    logging.info(f"Received search request for query: {query}")
    try:
        matches = acronym_service.find_matches(query)
        logging.info(f"Returning {len(matches)} matches for query: {query}")
        return jsonify(matches)
    except Exception as e:
        logging.error(f"Error occurred while searching acronyms: {str(e)}")
        return jsonify({"error": "An error occurred while searching acronyms"}), 500


@app.route("/api/acronyms/suggest", methods=["POST"])
def suggest_acronym():
    try:
        data = request.json
        acronym = data.get("acronym")
        expansion = data.get("expansion")
        context = data.get("context")

        if not acronym or not expansion:
            return jsonify({"error": "Acronym and expansion are required"}), 400

        success, message = acronym_service.suggest_acronym(acronym, expansion, context)
        if success:
            return jsonify({"message": message}), 200
        else:
            return jsonify({"error": message}), 500
    except Exception as e:
        logger.error(f"Error suggesting acronym: {str(e)}")
        return (
            jsonify(
                {"error": "An unexpected error occurred while suggesting the acronym"}
            ),
            500,
        )


@app.route("/reload_data", methods=["POST"])
def manual_reload_data():
    try:
        with app.app_context():
            result = load_data(app)
            subcategories = Subcategory.query.all()
            initialize_search_index(subcategories)
        socketio.emit("data_reloaded", {"message": "Data has been reloaded"})
        return jsonify({"message": result}), 200
    except Exception as e:
        logger.error(f"An error occurred during manual data reload: {str(e)}")
        logger.error(traceback.format_exc())
        return (
            jsonify(
                {"error": "An error occurred during data reload", "details": str(e)}
            ),
            500,
        )


if __name__ == "__main__":
    excel_file_path = app.config["EXCEL_FILE_PATH"]
    file_observer = start_file_watcher(excel_file_path)

    # Make sure to stop the observer when the app is shutting down
    import atexit

    if file_observer:
        atexit.register(file_observer.stop)

    socketio.run(app, debug=True)
