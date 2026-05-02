import serial
import requests
import time

PORT = "COM10"
BAUD = 9600

try:
    ser = serial.Serial(PORT, BAUD, timeout=1)
    print("System started. Listening to Arduino on COM10...")

    while True:
        try:
            if ser.in_waiting:
                line = ser.readline().decode(errors='ignore').strip()
                print("Received:", line)

                # heartbeat
                requests.post("http://127.0.0.1:5000/heartbeat", timeout=2)

                if "ALERT_SENT" in line:
                    print("Emergency triggered")

                    requests.post("http://127.0.0.1:5000/alert", timeout=10)
                    time.sleep(10)

            time.sleep(0.5)

        except Exception as e:
            print("Loop error:", e)
            time.sleep(1)

except KeyboardInterrupt:
    print("\n🛑 Stopping safely...")

finally:
    try:
        ser.close()
        print("Serial closed")
    except:
        pass