// Mau cau hinh WiFi / MQTT cho ESP8266.
// Chep file nay thanh secrets.h (cung thu muc) roi dien thong tin that. secrets.h khong dua len git.
#pragma once

const char* WIFI_SSID     = "TEN_WIFI_2.4GHZ";    // Ten WiFi 2.4GHz
const char* WIFI_PASSWORD = "MAT_KHAU_WIFI";      // Mat khau WiFi
const char* MQTT_HOST     = "192.168.1.100";      // IP may tinh chay Mosquitto
const uint16_t MQTT_PORT  = 1883;
const char* MQTT_USER     = "mqtt_username";      // Username dang nhap MQTT
const char* MQTT_PASSWORD = "mqtt_password";      // Mat khau dang nhap MQTT
