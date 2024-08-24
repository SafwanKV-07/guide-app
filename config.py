import os


class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or "sqlite:///guide.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    EXCEL_FILE_PATH = os.environ.get("EXCEL_FILE_PATH") or "data.xlsx"
