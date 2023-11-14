#include <Arduino.h>
//#include <ArduinoJson.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <TinyGPSPlus.h>
#include "TYPE1SC.h"
#include <U8x8lib.h>

#define ID 1

#define DebugSerial Serial
#define M1Serial Serial2

#define PWR_PIN 5
#define RST_PIN 18
#define WAKEUP_PIN 19
#define EXT_ANT 4
#define EXT_ANT_ON 0

#define U8LOG_WIDTH 16
#define U8LOG_HEIGHT 8

const char* ssid = "";
const char* password = "";
const char* serverName = "http://34.82.193.43/update";
const String key = "";

U8X8_SSD1306_128X64_NONAME_HW_I2C u8x8(U8X8_PIN_NONE);
uint8_t u8log_buffer[U8LOG_WIDTH * U8LOG_HEIGHT];
U8X8LOG u8x8log;

TYPE1SC TYPE1SC(M1Serial, DebugSerial, PWR_PIN, RST_PIN, WAKEUP_PIN);

unsigned long lastTime = 0;
unsigned long timerDelay = 5000;
double lat, lon, speed, alt, course;
uint32_t date, time_;
bool flag = false;

char IPAddr[32];
int _PORT = 80;
char sckInfo[128];
char recvBuffer[700];
int recvSize;

TinyGPSPlus gps;

void extAntenna() {
  if (EXT_ANT_ON) {
    pinMode(EXT_ANT, OUTPUT);
    digitalWrite(EXT_ANT, HIGH);
    delay(100);
  }
}

void setup() {
  u8x8.begin();
  u8x8.setFont(u8x8_font_chroma48medium8_r);
  u8x8log.begin(u8x8, U8LOG_WIDTH, U8LOG_HEIGHT, u8log_buffer);
  u8x8log.setRedrawMode(1); 
  u8x8log.print("Initiating...\n");

  DebugSerial.begin(115200);
  Serial1.begin(9600, SERIAL_8N1, 33, 32);
  M1Serial.begin(115200);
  
  extAntenna();
  gps = TinyGPSPlus();
  TYPE1SC.init();
  while (TYPE1SC.canConnect() != 0) {
    u8x8log.print("LTE not ready\n");
    delay(2000);
  }

  while (1) {
    if (TYPE1SC.getIPAddr("34.82.193.43", IPAddr, sizeof(IPAddr)) == 0) break;
    else {
      u8x8log.print("IP address error\n");
    }
    delay(1000);
  }
  //TYPE1SC.socketCreate(1, IPAddr, _PORT);
  //TYPE1SC.socketActivate();
  
  /*WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }*/

  //Serial.println(WiFi.localIP());
  u8x8.clear();
  u8x8log.print("Ready.\n");
}

void getgps() {
  lat = gps.location.lat();
  lon = gps.location.lng();
  date = gps.date.value();
  time_ = gps.time.value();
  speed = gps.speed.kmph();
  course = gps.course.deg();
  alt = gps.altitude.meters();
}

void loop() {
  while (Serial1.available() > 0) {
    char c = Serial1.read();
    if (gps.encode(c)) {
      if (gps.location.isValid()){
        flag = true;
        getgps(); 
      }
    }
  }

  if ((millis() - lastTime) > timerDelay) {
    if(flag == true) {
    /*if(WiFi.status()== WL_CONNECTED){
      WiFiClient client;
      HTTPClient http;
      http.begin(client, serverName);
      http.addHeader("Content-Type", "application/x-www-form-urlencoded");
      String httpRequestData = "key="+key+"&lat="+String(lat, 6)+"&lon="+String(lon, 6)+"&date="+String(date)+"&time="+String(time_)+"&speed="+String(speed)+"&course="+String(course)+"&alt="+String(alt);           
      int httpResponseCode = http.POST(httpRequestData);
      
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
        
      http.end();
      flag == false;
    }
    else {
      Serial.println("WiFi Disconnected");
    }*/

      while (TYPE1SC.canConnect() != 0) {
        u8x8log.print("LTE not ready\n");
        delay(2000);
      }
      TYPE1SC.socketCreate(1, IPAddr, _PORT);
      TYPE1SC.socketActivate();
      String httpRequestData = "key="+key+"&id="+ID+"&lat="+String(lat, 6)+"&lon="+String(lon, 6)+"&date="+String(date)+"&time="+String(time_)+"&speed="+String(speed)+"&course="+String(course)+"&alt="+String(alt);   

      String data = "POST /update HTTP/1.1\r\n";
      data += "Host: 34.82.193.43\r\n";
      data += "Content-Type:application/x-www-form-urlencoded\r\n";
      data += "Content-Length:" + String(httpRequestData.length()) + "\r\n";
      data += "\r\n" + httpRequestData;
      
      if (TYPE1SC.socketSend(data.c_str()) == 0) {
        u8x8log.print("[POST Sent]");
        u8x8log.print("\n");
      } 
      else {
        u8x8log.print("HTTP send error");
      }

      TYPE1SC.socketDeActivate();
      TYPE1SC.socketClose();

      flag = false;
      lastTime = millis();
    }
  }
}
