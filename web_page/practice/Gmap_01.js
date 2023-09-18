window.initMap = function () {
    const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 37.890162, lng: 127.733203},
    zoom: 8
    });

    const hallym = [
        { label: 1, name: "공학관", lat: 37.886037, lng:127.735935},
        { label: 17, name: "일송기념도서관", lat: 37.885081, lng: 127.737194},
        { label: 3, name: "의학관", lat: 37.885987, lng: 127.737230},
        { label: 7, name: "자연과학관", lat: 37.885750 , lng: 127.736898},
        { label: 9, name: "CLC", lat: 37.886504, lng: 127.740159},
        { label: 10, name : "강원대학교", lat: 37.869465, lng : 127.744717}
    ];

    const bounds = new google.maps.LatLngBounds();
    const infoWindow = new google.maps.InfoWindow();

    hallym.forEach(({label, name, lat, lng }) => {
        const marker = new google.maps.Marker({
            position: { lat , lng }, 
            label, 
            map
        });  
        bounds.extend(marker.position);

        marker.addListener("click", ()=> {
            map.panTo(marker.position);//마커중심이동
            infoWindow.setContent(name);
            infoWindow.open({
                anchor: marker,
                map
            })
        })
    })
    map.fitbounds(bounds);

};