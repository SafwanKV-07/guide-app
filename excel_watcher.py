import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from app import app, db
from data_loader import load_data


class ExcelHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith(".xlsx"):
            print(f"Excel file {event.src_path} has been modified")
            with app.app_context():
                load_data(app)
            print("Database updated")


if __name__ == "__main__":
    path = "."  # Path to the directory containing your Excel file
    event_handler = ExcelHandler()
    observer = Observer()
    observer.schedule(event_handler, path, recursive=False)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
