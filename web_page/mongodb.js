const { MongoClient } = require('mongodb');
const fs = require('fs');

// MongoDB 클러스터의 주소 및 정보 설정
const uri = "mongodb+srv://team16:cap_team16@cluster0.gfbbacs.mongodb.net/GPS";
const databaseName = "GPS";
const collectionName = "coordinate";

// MongoDB 클라이언트 생성
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// 데이터를 가져와서 파일에 저장하는 함수
async function fetchDataAndSaveToFile() {
  try {
    // MongoDB에 연결
    await client.connect();

    // 데이터베이스와 컬렉션 참조
    const database = client.db(databaseName);
    const collection = database.collection(collectionName);

    // 컬렉션에서 원하는 데이터 가져오기 (예: 모든 문서 가져오기)
    const data = await collection.find({}).toArray();

    // 데이터를 파일에 저장 (JSON 형식)
    fs.writeFileSync('data.json', JSON.stringify(data));
    
    console.log('데이터를 "data.json" 파일에 저장했습니다.');
  } catch (err) {
    console.error('데이터 가져오기 및 저장 오류:', err);
  } finally {
    // 연결 종료
    client.close();
  }
}

// 데이터 가져오기 및 저장 함수 호출
fetchDataAndSaveToFile();
