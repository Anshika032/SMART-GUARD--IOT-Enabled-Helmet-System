from flask import Flask, jsonify, request
from flask_cors import CORS
import threading

app = Flask(__name__)
CORS(app)

# GLOBAL STATE
device_status = "OFF"
last_seen = 0
accident_status = "SAFE"
last_alert_seen = 0
alert_count = 0
sms_count = 0
call_count = 0
alert_log = []


def format_alert_event(kind, severity, message, sms_state, status_state):
    return {
        "kind": kind,
        "severity": severity,
        "message": message,
        "sms": sms_state,
        "status": status_state,
                "ts": time.time(),
                "time": time.strftime("%d %b %H:%M", time.localtime()),
    }


def build_alert_stats(events):
        type_counts = {}
        severity_counts = {}
        helmet_on = 0
        helmet_off = 0

        for item in events:
                kind = (item.get("kind") or "UNKNOWN").upper()
                severity = (item.get("severity") or "UNKNOWN").upper()
                type_counts[kind] = type_counts.get(kind, 0) + 1
                severity_counts[severity] = severity_counts.get(severity, 0) + 1

                if kind == "HELMET OFF":
                    helmet_off += 1
                elif kind == "DEVICE":
                    helmet_on += 1
                elif kind == "ACCIDENT":
                    helmet_on += 1

/Developed by Anshika Shukla

    if missing:
        print("TWILIO ERROR: Missing env vars:", ", ".join(missing))
        return

    try:
        client = Client(account_sid, auth_token)

        message = client.messages.create(
            body="Emergency Alert from Helmet!",
            from_=from_number,
            to=to_number,
        )
        print("SMS SID:", message.sid)
        sms_count += 1

        call = client.calls.create(
    twiml='''
    <Response>
        <Say voice="alice">
            Accident detected. Emergency alert from SafeRide helmet.
            Please check the rider immediately.
        </Say>
    </Response>
    ''',
    from_=from_number,
    to=to_number,
)
        print("CALL SID:", call.sid)
        call_count += 1

    except Exception as e:
        print("TWILIO ERROR:", e)


@app.route("/status", methods=["GET"])
def status():
    global device_status, last_seen, accident_status, last_alert_seen, alert_log

    # if no data for 10 sec -> OFF
    if time.time() - last_seen > 10:
        device_status = "OFF"

    # keep accident state visible for a short time after an alert
    if last_alert_seen and time.time() - last_alert_seen > 15:
        accident_status = "SAFE"

    })

/Developed by Anshika Shukla
@app.route("/alert", methods=["POST"])
def alert():
    global device_status, last_seen, accident_status, last_alert_seen, alert_count, sms_count, call_count, alert_log

    device_status = "LIVE"
    last_seen = time.time()
    accident_status = "ACCIDENT!"
    last_alert_seen = time.time()
    alert_count += 1
    alert_log.insert(0, format_alert_event(
        "ACCIDENT",
        "CRITICAL",
        "Impact detected - alert sent to dashboard",
        "PENDING",
        "ACTIVE"
    ))
    alert_log = alert_log[:10]

/Developed by Anshika Shukla
@app.route("/heartbeat", methods=["POST"])
def heartbeat():
    global device_status, last_seen

    device_status = "LIVE"
    last_seen = time.time()

    return jsonify({"message": "Alive"})


if __name__ == "__main__":
    app.run(debug=True)
