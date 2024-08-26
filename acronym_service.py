from models import db, Acronym
from fuzzywuzzy import fuzz
import logging
from sqlalchemy.exc import IntegrityError


class AcronymService:
    def find_matches(self, query):
        query = query.upper()
        logging.info(f"Searching for acronym matches for query: {query}")
        all_acronyms = Acronym.query.filter_by(approved=True).all()
        logging.info(f"Found {len(all_acronyms)} approved acronyms in database")

        matches = []
        for acronym in all_acronyms:
            ratio = fuzz.ratio(query, acronym.acronym)
            logging.info(f"Comparing {query} to {acronym.acronym}: ratio = {ratio}")
            if ratio > 80 or query in acronym.acronym:
                matches.append(
                    {
                        "acronym": acronym.acronym,
                        "expansion": acronym.expansion,
                        "context": acronym.context,
                    }
                )

        logging.info(f"Found {len(matches)} matches for query: {query}")
        return matches

    def suggest_acronym(self, acronym, expansion, context=None):
        try:
            existing_acronym = Acronym.query.filter_by(acronym=acronym.upper()).first()
            if existing_acronym:
                existing_acronym.expansion = expansion
                existing_acronym.context = context
                existing_acronym.approved = True
                db.session.commit()
                logging.info(f"Existing acronym updated: {acronym} - {expansion}")
            else:
                new_acronym = Acronym(
                    acronym=acronym.upper(),
                    expansion=expansion,
                    context=context,
                    approved=True,
                )
                db.session.add(new_acronym)
                db.session.commit()
                logging.info(
                    f"New acronym suggested and added: {acronym} - {expansion}"
                )
            return True, "Acronym successfully added or updated"
        except IntegrityError as e:
            db.session.rollback()
            logging.error(f"IntegrityError while suggesting acronym: {str(e)}")
            return False, "An error occurred while suggesting the acronym"
        except Exception as e:
            db.session.rollback()
            logging.error(f"Error suggesting acronym: {str(e)}")
            return False, "An unexpected error occurred"

    def approve_acronym(self, acronym_id):
        acronym = Acronym.query.get(acronym_id)
        if acronym:
            acronym.approved = True
            db.session.commit()
            logging.info(f"Acronym approved: {acronym.acronym}")
        else:
            logging.warning(f"Acronym with id {acronym_id} not found")
