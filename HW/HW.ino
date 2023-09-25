#include <Arduino.h>
//#include <ArduinoJson.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <TinyGPS.h>
#define LED_BUILTIN 2

const char* ssid = "";
const char* password = "";
const char* serverName = "http://34.82.193.43/update";
const String key = "";

unsigned long lastTime = 0;
unsigned long timerDelay = 2500;
float lat, lon;
bool flag = false;

TinyGPS gps;

void setup() {
  gps = TinyGPS();
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(115200);
  Serial1.begin(9600, SERIAL_8N1, 33, 32);
  digitalWrite(LED_BUILTIN, HIGH);
  Serial.print("Connecting to ");
  Serial.print(ssid);

  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("Connected to WiFi network with IP Address: ");
  Serial.println(WiFi.localIP());
  digitalWrite(LED_BUILTIN, LOW);
}

void getgps() {
  gps.f_get_position(&lat, &lon);
  Serial.print("Lat/Lon: ");
  Serial.print(lat);
  Serial.print(", ");
  Serial.println(lon);
}

void loop() {
  while (Serial1.available() > 0) {
    char c = Serial1.read();
    //Serial.print(c);
    if (gps.encode(c)) {
      Serial.println("New Pos Data");
      flag = true;
      getgps(); 
    }
  }

  if ((millis() - lastTime) > timerDelay) {
    if(WiFi.status()== WL_CONNECTED){
      if(flag == true) {
        WiFiClient client;
        HTTPClient http;
        http.begin(client, serverName);
        http.addHeader("Content-Type", "application/x-www-form-urlencoded");
        String httpRequestData = "key="+key+"&lat="+String(lat, 6)+"&lon="+String(lon, 6);           
        int httpResponseCode = http.POST(httpRequestData);
        
        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);
          
        http.end();
        flag == false;
      }
    }
    else {
      Serial.println("WiFi Disconnected");
    }
    lastTime = millis();
  }
}
