
import os
import boto3
from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL",
    "sqlite:///students.db"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# AWS SNS configuration
SNS_TOPIC_ARN = os.getenv("SNS_TOPIC_ARN")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

sns_client = boto3.client(
    "sns",
    region_name=AWS_REGION
)


# Frontend home page
@app.route("/")
def home():
    return render_template("index.html")


# Send notification through Amazon SNS
@app.route("/send-notification", methods=["POST"])
def send_notification():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "")

    if not isinstance(message, str) or not message.strip():
        return jsonify({"error": "Message is required"}), 400

    if not SNS_TOPIC_ARN:
        app.logger.error("SNS_TOPIC_ARN is not configured")
        return jsonify({
            "error": "SNS topic ARN is not configured"
        }), 500

    try:
        response = sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject="Student Management System Notification",
            Message=message.strip()
        )

        return jsonify({
            "message": "Notification sent successfully",
            "message_id": response.get("MessageId")
        }), 200

    except Exception:
        app.logger.exception("SNS notification failed")
        return jsonify({
            "error": "Notification failed"
        }), 502
