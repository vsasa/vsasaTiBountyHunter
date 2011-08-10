(function() {
	bh.ui = {};
	
	bh.ui.createAddWindow = function() {
		var win = Ti.UI.createWindow({
			title:L('new_fugitive'),
			layout:'vertical',
			backgroundColor:'#fff'
		});
		
		if (Ti.Platform.osname === 'iphone') {
			var b = Titanium.UI.createButton({
				title:'Close',
				style:Titanium.UI.iPhone.SystemButtonStyle.PLAIN
			});
			b.addEventListener('click',function() {
				win.close();
			});
			win.setRightNavButton(b);
		}
		
		var tf = Ti.UI.createTextField({
			height:40,
			top:10,
			width:250,
			keyboardType:Titanium.UI.KEYBOARD_DEFAULT,
			returnKeyType:Titanium.UI.RETURNKEY_DONE,
			borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED,
			hintText:L('fugitive_name')
		});
		win.add(tf);

		var save = Ti.UI.createButton({
			title:L('save'),
			height:40,
			width:80,
			top:10
		});
		save.addEventListener('click', function() {
			bh.db.add(tf.value);
			win.close();
		});
		win.add(save);
		
		return win;
	};
	
	bh.ui.createMapWindow = function(/*Object*/ _bounty) {
		Ti.API.info('Showing at coords... '+_bounty.capturedLat+':'+_bounty.capturedLong);
		
		var win = Ti.UI.createWindow({
			title:L('busted_at'),
			backgroundColor:'#fff'
		});
		
		var ann = Ti.Map.createAnnotation({
			latitude:_bounty.capturedLat,
			longitude:_bounty.capturedLong,
			title:_bounty.name,
			subtitle:L('busted'),
			pincolor:Ti.Map.ANNOTATION_RED,
			animate:true
		});
		
		var mapview = Ti.Map.createView({
			mapType: Ti.Map.STANDARD_TYPE,
			region:{latitude:_bounty.capturedLat, longitude:_bounty.capturedLong, latitudeDelta:0.1, longitudeDelta:0.1},
			animate:true,
			regionFit:true,
			userLocation:false,
			annotations:[ann]
		});
		
		win.add(mapview);
		
		return win;
	};
	
	Ti.Geolocation.purpose = 'Tracking down criminal scum';
	bh.ui.createDetailWindow = function(/*Object*/ _bounty) {
		Ti.API.info(_bounty.captured);

		var win = Ti.UI.createWindow({
			title:_bounty.title,
			layout:'vertical'
		});
		
		win.add(Ti.UI.createLabel({
			text:(_bounty.captured) ? L('busted') : L('still_at_large'),
			top:10,
			textAlign:'center',
			font: {
				fontWeight:'bold',
				fontSize:18
			},
			height:'auto'
		}));
		
		Ti.API.info(_bounty.url);
		var imgView = Ti.UI.createImageView({
			image:(_bounty.url) ? _bounty.url : 'burglar.png',
			height:150/2,
			width:120/2,
			top:10
		});
		win.add(imgView);
		
		var photoButton = Ti.UI.createButton({
			title:L('photo'),
			top:10,
			height:40,
			width:200
		});
		photoButton.addEventListener('click', function() {
			if(Ti.Media.isCameraSupported) {
				Ti.Media.showCamera({
					success:function(event) {
						var image = event.media;
						imgView.image = image;
						
						//save for future use
						var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory,'photo'+_bounty.id+'.png');
						f.write(image);
						bh.db.addPhoto(_bounty.id,f.nativePath);
					},
					cancel:function() {},
					error:function(error) {
						var a = Ti.UI.createAlertDialog({title:L('camera_error')});
						if (error.code == Ti.Media.NO_CAMERA) {
							a.setMessage(L('camera_error_details'));
						}
						else {
							a.setMessage('Unexpected error: ' + error.code);
						}
						a.show();
					},
					saveToPhotoGallery:true,
					allowEditing:true,
					mediaTypes:[Ti.Media.MEDIA_TYPE_PHOTO]
				});
			} else {
				Ti.Media.openPhotoGallery({
					success:function(event) {
						var image = event.media;
						imgView.image = image;
						
						//save for future use
						var f = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory,'photo'+_bounty.id+'.png');
						f.write(image);
						bh.db.addPhoto(_bounty.id,f.nativePath);
					},
					cancel:function() {},
					error:function(error) {
						var a = Ti.UI.createAlertDialog({title:L('camera_error')});
						if (error.code == Ti.Media.NO_CAMERA) {
							a.setMessage(L('camera_error_details'));
						}
						else {
							a.setMessage('Unexpected error: ' + error.code);
						}
						a.show();
					},
					saveToPhotoGallery:true,
					allowEditing:true,
					mediaTypes:[Ti.Media.MEDIA_TYPE_PHOTO]
				});
			}
		});
		win.add(photoButton);
		
		if (!_bounty.captured) {
			var captureButton = Ti.UI.createButton({
				title:L('capture'),
				top:10,
				height:30,
				width:200
			});
			captureButton.addEventListener('click', function() {
				if (Ti.Geolocation.locationServicesEnabled) {
					Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_BEST;
					Ti.Geolocation.getCurrentPosition(function(e) {
						//var lng = e.coords.longitude;
						//var lat = e.coords.latitude;
						//bh.db.bust(_bounty.id, lat, lng);
						bh.db.bust(_bounty.id, 0, 0);
			
						bh.net.bustFugitive(Ti.Platform.id, function(_data) {
							Ti.UI.createAlertDialog({
								message:_data.message
							}).show();

							//on android, give a bit of a delay before closing the window...
							if (Ti.Platform.osname == 'android') {
								setTimeout(function() {
									win.close();
								},2000);
							}
							else {
								win.close();
							}
						});
					});
				}
				else {
					Ti.UI.createAlertDialog({
						title:L('geo_error'), 
						message:L('geo_error_details')
					}).show();
				}
			});
			win.add(captureButton);
		}
		else {
			var mapButton = Ti.UI.createButton({
				title:L('map_button'),
				top:10,
				height:30,
				width:200
			});
			mapButton.addEventListener('click', function() {
				var tab = (_bounty.captured) ? bh.capturedTab : bh.fugitivesTab;
				tab.open(bh.ui.createMapWindow(_bounty));
			});
			win.add(mapButton);
		}
		
		var deleteButton = Ti.UI.createButton({
			title:L('delete'),
			top:10,
			height:30,
			width:200
		});
		deleteButton.addEventListener('click', function() {
			bh.db.del(_bounty.id);
			win.close();
		});
		win.add(deleteButton);
		
		Ti.Facebook.appid = "184482501591139"; //"217629481582774";
		Ti.Facebook.permissions = ['publish_stream'];
		
		if (_bounty.captured) {
			var shareButton = Ti.UI.createButton({
				title:L('share'),
				top:10,
				height:30,
				width:200
			});
			shareButton.addEventListener('click', function() {
				if (Ti.Facebook.loggedIn) {
						var f = imgView.toBlob();
						var blob = f;
						var data = {
							message: 'behold! '+_bounty.title+" has been caught!",
							picture: blob
						};
						Ti.Facebook.requestWithGraphPath('me/photos', data, 'POST', showRequestResult);
				} else {
					alert('Please login to facebook first');
				}
			});
			win.add(shareButton);
			
			var fbButton = Ti.Facebook.createLoginButton();
			win.add(fbButton);
			
			var viewFacebook = Ti.UI.createView({
				width: 120,
				height: 20,
				top: 10 
			});
			
			viewFacebook.add(fbButton);
			win.add(viewFacebook);
			
			
		}
		
		return win;
	};
	
	function showRequestResult(e){
				alert('Your capture has been posted to Facebook!');
			}
	
	bh.ui.createBountyTableView = function(/*Boolean*/ _captured) {
		var tv = Ti.UI.createTableView();
		
		tv.addEventListener('click', function(_e) {
			var tab = (_captured) ? bh.capturedTab : bh.fugitivesTab;
			tab.open(bh.ui.createDetailWindow(_e.rowData));
		});
		
		function populateData() {
			var results = bh.db.list(_captured);			
			tv.setData(results);
		}
		Ti.App.addEventListener('databaseUpdated', populateData);
		
		//run initial query
		populateData();
		
		return tv;
	};
	
	bh.ui.createBountyWindow = function(/*Boolean*/ _captured) {
		var win = Titanium.UI.createWindow({
		  title: (_captured) ? L('captured') : L('fugitives'),
			activity : {
				onCreateOptionsMenu : function(e) {
					var menu = e.menu;
					var m1 = menu.add({ title : L('add') });
					m1.addEventListener('click', function(e) {
						//open in tab group to get free title bar (android)
						var tab = (_captured) ? bh.capturedTab : bh.fugitivesTab;
						tab.open(bh.ui.createAddWindow());
					});
				}
			}
		});
		win.add(bh.ui.createBountyTableView(_captured));
		
		if (Ti.Platform.osname === 'iphone') {
			var b = Titanium.UI.createButton({
				title:L('add'),
				style:Titanium.UI.iPhone.SystemButtonStyle.PLAIN
			});
			b.addEventListener('click',function() {
				//open modal on iOS - looks more appropriate
				bh.ui.createAddWindow().open({modal:true});
			});
			win.setRightNavButton(b);
		}
		return win;
	};
	
	bh.ui.createApplicationTabGroup = function() {
		var tabGroup = Titanium.UI.createTabGroup();
		
		var fugitives = bh.ui.createBountyWindow(false);
		var captured = bh.ui.createBountyWindow(true);
		
		bh.fugitivesTab = Titanium.UI.createTab({
		  title: L('fugitives'),
		  window: fugitives
		});
		
		bh.capturedTab = Titanium.UI.createTab({
		  title: L('captured'),
		  window: captured
		});
		
		tabGroup.addTab(bh.fugitivesTab);
		tabGroup.addTab(bh.capturedTab);
		
		return tabGroup;
	};
})();