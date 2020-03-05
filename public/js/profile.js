// vars
var result = document.querySelector('.result'),
img_result = document.querySelector('.img-result'),
img_w = document.querySelector('.img-w'),
img_h = document.querySelector('.img-h'),
options = document.querySelector('.options'),
save = document.querySelector('#actionsave'),
cropped = document.querySelector('.cropped'),
dwn = document.querySelector('.download'),
upload = document.querySelector('#file-input'),
cropper = '';

upload.addEventListener('change', function(e) {
	if(e.target.files.length) {
		console.log("change");
		var reader = new FileReader();
		reader.onload = function(e) {
			if(e.target.result) {
				var img = document.createElement('img');
				img.id = 'image';
				img.src = e.target.result;
				result.innerHTML = '';
				result.appendChild(img);
				save.classList.remove('hide');
				cropper = new Cropper(img,{
					// aspectRatio: 4/3,
					viewMode: 3,
					dragMode: 'move',
					autoCropArea: 1,
					restore: false,
					responsive: true,
					moveable: true,
					scaleable: false,
					modal: true,
					guides: false,
					highlight: false,
					cropBoxMovable: true,
					cropBoxResizable: true,
					toggleDragModeOnDblclick: false,
					background: true,
					zoomOnWheel: false,
				});
			}
		};
		reader.readAsDataURL(e.target.files[0]);
	}
});

// save.addEventListener('click',function(e) {
// 	e.preventDefault();
// 	var imgSrc = cropper.getCroppedCanvas({
// 		width: "614"
// 	}).toDataURL(function(data) {
// 		console.log("Save!");
// 		$.ajax('/upload', {
// 			method:'POST',
// 			data: imgSrc,
// 			processData: false,
// 			contentType: false,
// 			xhr: function() {
// 				var xhr = new XMLHttpRequest();
// 			};
// 		return xhr;
// 	});
// });

save.addEventListener('click', function(e) {
	e.preventDefault();
	var imgSrc = cropper.getCroppedCanvas({
		imageSmoothingEnabled: false,
		fillCOlor:'#000000',
		width: "614",
	}).toDataURL('image/jpeg');
	// console.log(imgSrc);
	var fileName  = $('#file-input').val().replace("C:\\fakepath\\","");
	var xhr = new XMLHttpRequest();
	xhr.onload = function(e) {
		console.log('HELLO');
		console.log('SERVER RES: '+this.responseText);
		window.location.replace("/");
		// var data = JSON.parse(this.responseText);
		// console.log(data);
	}
	xhr.open('POST','/upload', true);
	// xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
	xhr.setRequestHeader('Content-Type','application/json;charset=UTF-8');
	console.log("UPLOAD FILE NAME:"+fileName);
	xhr.send(JSON.stringify({filename:fileName,imagedata:imgSrc}));
});