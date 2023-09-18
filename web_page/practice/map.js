// map.js

// Google Maps를 초기화하는 함수
function initMap() {
    const map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 37.890162, lng: 127.733203 }, // 초기 중심 위치
        zoom: 8, // 초기 줌 레벨
    });

    // 클릭한 위치에 마커를 추가하고 위도, 경도를 표시합니다.
    map.addListener('click', (event) => {
        placeMarker(event.latLng, map);
    });
}

// 클릭한 위치에 마커를 추가하고 위도, 경도를 표시하는 함수
function placeMarker(location, map) {
    const marker = new google.maps.Marker({
        position: location,
        map: map,
    });

    // 위도와 경도를 가져옵니다.
    const latitude = location.lat();
    const longitude = location.lng();

    // 정보 창을 생성하고 위도, 경도를 표시합니다.
    const infowindow = new google.maps.InfoWindow({
        content: `위도: ${latitude}, 경도: ${longitude}`,
    });

    // 정보 창을 엽니다.
    infowindow.open(map, marker);
}
