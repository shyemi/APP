from flask import Flask, jsonify, request, render_template
from models import db, Book, Student, Loan
import os
from datetime import datetime, timezone

app = Flask(__name__)
# Database configuration
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'library.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Create tables if they don't exist
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

# --- API Endpoints ---

# Dashboard Stats
@app.route('/api/stats', methods=['GET'])
def get_stats():
    total_books = db.session.query(db.func.sum(Book.quantity)).scalar() or 0
    available_books = db.session.query(db.func.sum(Book.available)).scalar() or 0
    total_students = Student.query.count()
    active_loans = Loan.query.filter_by(status='active').count()
    
    return jsonify({
        'total_books': total_books,
        'available_books': available_books,
        'total_students': total_students,
        'active_loans': active_loans
    })

# Books CRUD
@app.route('/api/books', methods=['GET'])
def get_books():
    books = Book.query.all()
    return jsonify([book.to_dict() for book in books])

@app.route('/api/books', methods=['POST'])
def add_book():
    data = request.json
    new_book = Book(
        title=data.get('title'),
        author=data.get('author'),
        isbn=data.get('isbn'),
        category=data.get('category'),
        quantity=data.get('quantity', 1),
        available=data.get('quantity', 1)
    )
    db.session.add(new_book)
    db.session.commit()
    return jsonify(new_book.to_dict()), 201

# Students CRUD
@app.route('/api/students', methods=['GET'])
def get_students():
    students = Student.query.all()
    return jsonify([student.to_dict() for student in students])

@app.route('/api/students', methods=['POST'])
def add_student():
    data = request.json
    # Check if student already exists by student_id
    existing = Student.query.filter_by(student_id=data.get('student_id')).first()
    if existing:
        return jsonify({'error': 'Student ID already exists'}), 400

    new_student = Student(
        name=data.get('name'),
        grade=data.get('grade'),
        student_id=data.get('student_id')
    )
    db.session.add(new_student)
    db.session.commit()
    return jsonify(new_student.to_dict()), 201

# Loans CRUD
@app.route('/api/loans', methods=['GET'])
def get_loans():
    loans = Loan.query.all()
    return jsonify([loan.to_dict() for loan in loans])

@app.route('/api/loans', methods=['POST'])
def issue_loan():
    data = request.json
    book_id = data.get('book_id')
    student_id = data.get('student_id')
    
    book = Book.query.get(book_id)
    if not book or book.available <= 0:
        return jsonify({'error': 'Book not available'}), 400
        
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404
        
    new_loan = Loan(book_id=book_id, student_id=student_id)
    book.available -= 1
    
    db.session.add(new_loan)
    db.session.commit()
    return jsonify(new_loan.to_dict()), 201

@app.route('/api/loans/<int:loan_id>/return', methods=['POST'])
def return_loan(loan_id):
    loan = Loan.query.get(loan_id)
    if not loan or loan.status == 'returned':
        return jsonify({'error': 'Invalid loan or already returned'}), 400
        
    loan.status = 'returned'
    loan.return_date = datetime.now(timezone.utc)
    
    book = Book.query.get(loan.book_id)
    if book:
        book.available += 1
        
    db.session.commit()
    return jsonify(loan.to_dict()), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
