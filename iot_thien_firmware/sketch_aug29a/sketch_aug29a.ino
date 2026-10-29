#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"
#include <time.h>

const long GMT_OFFSET_SEC = 7 * 3600; // Gio Viet Nam UTC+7
const int DAYLIGHT_OFFSET_SEC = 0;

// ---------- Cau hinh phan cung ----------
#define DHTPIN D4        // Data DHT11 noi D4 (GPIO2)
#define DHTTYPE DHT11    // Loai cam bien DHT11
#define LDRPIN A0        // Quang tro noi A0
#define LEDPIN D0        // LED noi D0 (GPIO16) - relay/den that duy nhat hien co

// ---------- Cau hinh WiFi va MQTT - CAN CHINH TRUOC KHI NAP ----------
// WIFI_SSID, WIFI_PASSWORD, MQTT_HOST, MQTT_PORT, MQTT_USER, MQTT_PASSWORD nam trong secrets.h
// (khong dua len git). Lan dau: chep secrets.example.h thanh secrets.h roi dien thong tin that.
#include "secrets.h"
const char* NODE_ID       = "esp8266-01";

// ---------- Ma cam bien / thiet bi khop voi bang sensors/devices trong CSDL ----------
// LIGHT_01 la thiet bi that duy nhat (LED tren chan D0).
const char* SENSOR_CODE   = "SENSOR_01";
const char* DEVICE_CODE   = "LIGHT_01";

// ---------- Topic MQTT theo dung thiet ke Chuong 2.8 cua bao cao ----------
String TOPIC_SENSOR_DATA;    // iot/sensors/{sensorCode}/data   - ESP8266 -> Backend
String TOPIC_DEVICE_COMMAND; // iot/devices/{deviceCode}/command - Backend -> ESP8266
String TOPIC_DEVICE_STATUS;  // iot/devices/{deviceCode}/status  - ESP8266 -> Backend (ACK)
String TOPIC_HEARTBEAT;      // iot/nodes/{nodeId}/heartbeat     - ESP8266 -> Backend

const unsigned long SENSOR_INTERVAL_MS    = 2000;  // Chu ky publish du lieu cam bien
const unsigned long HEARTBEAT_INTERVAL_MS = 30000; // Chu ky gui heartbeat
const unsigned long WIFI_RETRY_MS         = 10000; // Chu ky thu lai WiFi khi mat ket noi
const unsigned long MQTT_RETRY_MS         = 3000;  // Chu ky thu lai MQTT khi mat ket noi

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
DHT dht(DHTPIN, DHTTYPE);

bool ledOn = false;
unsigned long lastSensorPublish = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastWiFiAttempt = 0;
unsigned long lastMQTTAttempt = 0;

// Ham doc trung binh ADC de loc nhieu cho quang tro
int readLdrFiltered(uint8_t samples = 10) {
  long sum = 0;
  for (uint8_t i = 0; i < samples; i++) {
    sum += analogRead(LDRPIN);
    delay(15);
  }
  return (int)(sum / samples);
}

// Tra ve ISO-8601 co offset +07:00 (dung dinh dang JSON cua bao cao), can WiFi + NTP xong moi dung
String getIsoTimestamp() {
  time_t now = time(nullptr);
  if (now < 1700000000) { // Chua dong bo xong NTP
    return "";
  }
  struct tm timeinfo;
  localtime_r(&now, &timeinfo);
  char buf[32];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%S+07:00", &timeinfo);
  return String(buf);
}

// Dinh dang ngay gio de hien thi tren Serial Monitor cho de doc (khong T, khong +07:00),
// khong dung cho JSON gui len MQTT vi backend can dung chuan ISO-8601 nhu getIsoTimestamp()
String getDisplayTimestamp() {
  time_t now = time(nullptr);
  if (now < 1700000000) {
    return "";
  }
  struct tm timeinfo;
  localtime_r(&now, &timeinfo);
  char buf[24];
  strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buf);
}

void applyLed(bool on) {
  ledOn = on;
  digitalWrite(LEDPIN, on ? HIGH : LOW);
}

// Tim gia tri chuoi ung voi "key":"value" trong mot doan JSON don gian (khong dung thu vien ngoai)
String extractJsonString(const String& json, const String& key) {
  String needle = "\"" + key + "\":\"";
  int start = json.indexOf(needle);
  if (start < 0) return "";
  start += needle.length();
  int end = json.indexOf('"', start);
  if (end < 0) return "";
  return json.substring(start, end);
}

// Publish ACK ve topic status voi cung actionCode nhan duoc (dung de Backend doi chieu UC04)
void publishStatus(const String& actionCode, bool success) {
  String payload;
  payload.reserve(180);
  payload  = "{\"actionCode\":\"" + actionCode + "\",";
  payload += "\"deviceCode\":\"" + String(DEVICE_CODE) + "\",";
  payload += "\"status\":\"" + String(ledOn ? "ON" : "OFF") + "\",";
  payload += "\"result\":\"" + String(success ? "SUCCESS" : "REJECTED") + "\",";
  payload += "\"confirmedAt\":\"" + getIsoTimestamp() + "\"}";
  mqttClient.publish(TOPIC_DEVICE_STATUS.c_str(), payload.c_str());
}

// Xu ly lenh ON/OFF, dung chung cho ca lenh tu Serial va tu MQTT
void handleCommand(String action, const String& actionCode, bool fromMqtt) {
  action.trim();
  action.toUpperCase();
  if (action.length() == 0) return;

  if (action == "ON") {
    applyLed(true);
    Serial.println("Bat den");
    if (fromMqtt) publishStatus(actionCode, true);
  } else if (action == "OFF") {
    applyLed(false);
    Serial.println("Tat den");
    if (fromMqtt) publishStatus(actionCode, true);
  } else {
    // AUTO hoac gia tri khac: node nay chua ho tro che do tu dong, tu choi lenh
    if (fromMqtt) publishStatus(actionCode, false);
  }
}

// Van giu duong nhap lenh qua Serial Monitor de test thu cong khi can
void handleSerialCommand() {
  while (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    handleCommand(cmd, "", false);
  }
}

// Nhan lenh JSON tu topic command qua MQTT: {"actionCode":..,"deviceCode":..,"action":..,"mode":..}
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  message.reserve(length);
  for (unsigned int i = 0; i < length; i++) {
    message += static_cast<char>(payload[i]);
  }
  if (String(topic) == TOPIC_DEVICE_COMMAND) {
    String actionCode = extractJsonString(message, "actionCode");
    String action = extractJsonString(message, "action");
    handleCommand(action, actionCode, true);
  }
}

void startWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  lastWiFiAttempt = millis();
  Serial.println();
  Serial.print("[WiFi] Dang ket noi toi: ");
  Serial.println(WIFI_SSID);
}

// Ten trang thai WiFi de in ra Serial
const char* wifiStatusText(wl_status_t status) {
  switch (status) {
    case WL_NO_SSID_AVAIL: return "khong tim thay WiFi (sai ten hoac khong phai 2.4GHz)";
    case WL_CONNECT_FAILED: return "ket noi that bai";
    case WL_WRONG_PASSWORD: return "sai mat khau WiFi";
    case WL_DISCONNECTED: return "dang ket noi / mat ket noi";
    case WL_IDLE_STATUS: return "dang cho";
    default: return "khac";
  }
}

// Theo doi va tu ket noi lai WiFi, khong dung delay() chan chuong trinh
void maintainWiFi() {
  static wl_status_t lastStatus = WL_IDLE_STATUS;
  wl_status_t status = WiFi.status();
  // In ra moi khi trang thai WiFi thay doi (de chan doan qua Serial Monitor)
  if (status != lastStatus) {
    lastStatus = status;
    if (status == WL_CONNECTED) {
      Serial.print("[WiFi] Da ket noi, IP: ");
      Serial.println(WiFi.localIP());
    } else {
      Serial.print("[WiFi] Trang thai: ");
      Serial.println(wifiStatusText(status));
    }
  }
  if (status != WL_CONNECTED && millis() - lastWiFiAttempt >= WIFI_RETRY_MS) {
    lastWiFiAttempt = millis();
    WiFi.reconnect();
  }
}

// Theo doi va tu ket noi lai MQTT, subscribe lai topic command sau moi lan ket noi thanh cong
void maintainMQTT() {
  if (WiFi.status() != WL_CONNECTED || mqttClient.connected()) return;
  if (millis() - lastMQTTAttempt < MQTT_RETRY_MS) return;
  lastMQTTAttempt = millis();

  String clientId = "ESP8266-" + String(ESP.getChipId(), HEX);
  Serial.print("[MQTT] Ket noi toi ");
  Serial.print(MQTT_HOST);
  Serial.print(":");
  Serial.print(MQTT_PORT);
  Serial.print(" ... ");
  if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD)) {
    Serial.println("thanh cong");
    mqttClient.subscribe(TOPIC_DEVICE_COMMAND.c_str(), 1);
    // Bao ngay trang thai that (vd: OFF sau khi vua boot) de Backend/Dashboard
    // khong con hien thi trang thai cu tu truoc khi mat nguon/reset.
    publishStatus("", true);
  } else {
    // state(): -2 khong toi duoc may chu (sai IP / bi chan), 4 sai tai khoan MQTT, 5 khong duoc phep
    Serial.print("that bai, state = ");
    Serial.println(mqttClient.state());
  }
}

// Doc DHT11 + quang tro, publish JSON len topic telemetry theo dung dinh dang bao cao
void publishSensorData() {
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  int lightRaw = readLdrFiltered(10);

  if (isnan(humidity) || isnan(temperature)) {
    return;
  }

  String timestamp = getIsoTimestamp();
  if (timestamp.length() == 0) return; // Chua dong bo NTP xong thi bo qua chu ky nay

  String payload;
  payload.reserve(180);
  payload  = "{\"sensorCode\":\"" + String(SENSOR_CODE) + "\",";
  payload += "\"temperature\":" + String(temperature, 1) + ",";
  payload += "\"humidity\":" + String(humidity, 1) + ",";
  payload += "\"light\":" + String(lightRaw) + ",";
  payload += "\"timestamp\":\"" + timestamp + "\"}";

  mqttClient.publish(TOPIC_SENSOR_DATA.c_str(), payload.c_str(), false);

  Serial.print("Nhiet do: ");
  Serial.print(temperature, 1);
  Serial.print(" *C | Do am: ");
  Serial.print(humidity, 1);
  Serial.print(" % | Anh sang: ");
  Serial.print(lightRaw);
  Serial.print(" | Thoi gian: ");
  Serial.println(getDisplayTimestamp());
}

void publishHeartbeat() {
  String timestamp = getIsoTimestamp();
  if (timestamp.length() == 0) return;
  String payload = "{\"nodeId\":\"" + String(NODE_ID) + "\",\"timestamp\":\"" + timestamp + "\"}";
  mqttClient.publish(TOPIC_HEARTBEAT.c_str(), payload.c_str());
}

void setup() {
  Serial.begin(115200);
  pinMode(LEDPIN, OUTPUT);
  applyLed(false);

  TOPIC_SENSOR_DATA    = "iot/sensors/" + String(SENSOR_CODE) + "/data";
  TOPIC_DEVICE_COMMAND = "iot/devices/" + String(DEVICE_CODE) + "/command";
  TOPIC_DEVICE_STATUS  = "iot/devices/" + String(DEVICE_CODE) + "/status";
  TOPIC_HEARTBEAT      = "iot/nodes/" + String(NODE_ID) + "/heartbeat";

  dht.begin();
  startWiFi();
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, "pool.ntp.org", "time.nist.gov");
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
}

void loop() {
  maintainWiFi();
  maintainMQTT();
  if (mqttClient.connected()) {
    mqttClient.loop(); // Bat buoc goi thuong xuyen de nhan lenh va giu keep-alive
  }

  handleSerialCommand();

  unsigned long now = millis();
  if (mqttClient.connected() && now - lastSensorPublish >= SENSOR_INTERVAL_MS) {
    lastSensorPublish = now;
    publishSensorData();
  }
  if (mqttClient.connected() && now - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeat = now;
    publishHeartbeat();
  }
}
