window.initMap = function () {
    const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 37.890162, lng: 127.733203},
    zoom: 8
    });

    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 37.7749, lng: -122.4194 }, // 기본 지도 중심 좌표
        zoom: 10, // 기본 줌 레벨
      });

      map.addListener("click", (event) => {
        placeMarker(event.latLng);
      });
    

    function placeMarker(location) {
      if (marker) {
        marker.setMap(null); // 이전 마커 제거
      }

      marker = new google.maps.Marker({
        position: location,
        map: map,
      });

      // 클릭한 위치의 위도와 경도 업데이트
      document.getElementById("latitude").textContent = location.lat();
      document.getElementById("longitude").textContent = location.lng();
    }
}