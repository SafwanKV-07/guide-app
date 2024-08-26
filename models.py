from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    subcategories = db.relationship("Subcategory", backref="category", lazy=True)


class Subcategory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    document_type = db.Column(db.String(100), nullable=False)
    identification_rules = db.Column(db.Text, nullable=False)
    supporting_information = db.Column(db.Text)
    category_id = db.Column(db.Integer, db.ForeignKey("category.id"), nullable=False)


class Update(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    reference = db.Column(db.String(100), nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    main_folder = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)


class Acronym(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    acronym = db.Column(db.String(50), nullable=False, unique=True)
    expansion = db.Column(db.String(200), nullable=False)
    context = db.Column(db.String(100))
    approved = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp(),
        onupdate=db.func.current_timestamp(),
    )
