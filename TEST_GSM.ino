#include <SoftwareSerial.h>

SoftwareSerial gsm(7, 8);

int touchPin = 2;
bool sent = false;

void setup() {
  pinMode(touchPin, INPUT);
  Serial.begin(9600);
  gsm.begin(9600);

  delay(5000); // GSM boot
}

void loop() {

  int touch = digitalRead(touchPin);

  if (touch == HIGH && !sent) {

    Serial.println("Touch detected → Sending SMS");

    gsm.println("AT+CMGF=1");
    delay(1000);

    gsm.println("AT+CMGS=\"+919982254686\"");
    delay(1000);

    gsm.print("🚨 Emergency Alert! Touch detected.");
    delay(500);

    gsm.write(26);
    delay(5000);

    sent = true;  // prevent spam
  }

  if (touch == LOW) {
    sent = false; // reset when released
  }
}
