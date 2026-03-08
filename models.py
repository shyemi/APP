from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()

class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(200), nullable=False)
    isbn = db.Column(db.String(50), unique=True, nullable=True)
    category = db.Column(db.String(100), nullable=True)
    quantity = db.Column(db.Integer, default=1)
    available = db.Column(db.Integer, default=1)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'author': self.author,
            'isbn': self.isbn,
            'category': self.category,
            'quantity': self.quantity,
            'available': self.available
        }

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    grade = db.Column(db.String(50), nullable=False)
    student_id = db.Column(db.String(100), unique=True, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'grade': self.grade,
            'student_id': self.student_id
        }

class Loan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('book.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    borrow_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    return_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='active') # 'active', 'returned'

    book = db.relationship('Book', backref=db.backref('loans', lazy=True))
    student = db.relationship('Student', backref=db.backref('loans', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'book_id': self.book_id,
            'student_id': self.student_id,
            'borrow_date': self.borrow_date.isoformat() if self.borrow_date else None,
            'return_date': self.return_date.isoformat() if self.return_date else None,
            'status': self.status,
            'book_title': self.book.title if self.book else None,
            'student_name': self.student.name if self.student else None
        }
