var rhit = rhit || {};

rhit.FB_COLLECTION_IMAGE = "Images";
rhit.FB_KEY_IMAGE = "image";
rhit.FB_KEY_CAPTION = "caption";
rhit.FB_KEY_AUTHOR = "author";


function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.LoginPageController = class {
	constructor() {
		document.querySelector("#rosefireButton").onclick = (event) => {
			rhit.FbAuthManager.signIn();
		}
	}
}

rhit.FbAuthManager = class {
	constructor() {   this._user = null; }
	beginListening(changeListener) {
	  firebase.auth().onAuthStateChanged((user) => {
		this._user = user;
		changeListener();
	  });
	}
	signIn() {   
		Rosefire.signIn("0802f561-c735-4525-9ea0-e4a5c6fb83e4", (err, rfUser) => {
			if (err) {
			  console.log("Rosefire error!", err);
			  return;
			}
			console.log("Rosefire success!", rfUser);
			
			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
				var errorCode = error.code;
				var errorMessage = error.message;
				if(errorCode === 'auth/invalid-custom-token') {
					alert('the token you provided is not valid');
				} else {
					console.error("Custom auth error", errorCode, errorMessage);
				}
			});
		  });		  
	}
	signOut() {   firebase.auth().signOut(); }
	get uid() {   return this._user.uid; }
	get isSignedIn() {   return !!this._user; }
}

rhit.Image = class {
	constructor(id, image, caption, author) {
	  this.id = id;
	  this.image = image;
	  this.caption = caption; 
	  this.author = author 
	}
}

rhit.fbImageManager = class {
	constructor(uid) {
	  this._uid = uid;
	  this._documentSnapshots = [];
	  this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_IMAGE);
	  this._unsubscribe = null;
	}
	add(image, caption) {  
		this._ref.add({
			[rhit.FB_KEY_IMAGE]: image,
			[rhit.FB_KEY_CAPTION]: caption,
			[rhit.FB_KEY_AUTHOR]: rhit.FbAuthManager.uid,
		})
		.then(function (docRef) {
			console.log("ID ", docRef.id);
		})
		.catch(function (error) {
			console.error("Error ", error);
		});
		console.log(rhit.FbAuthManager.uid);
	}
	beginListening(changeListener) { 
		let query = this._ref

		this._unsubscribe = query
		.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
		
			changeListener();
		});
	}
	stopListening() {   
		this._unsubscribe();
	}
	update(id, image, caption) {    

	}
	delete(id) { 

	}
	get length() {    
		return this._documentSnapshots.length;
	}
	getImageatIndex(index) {  
		const docSnapshot = this._documentSnapshots[index];  
		const image = new rhit.Image(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_IMAGE),
			docSnapshot.get(rhit.FB_KEY_CAPTION),
			docSnapshot.get(rhit.FB_KEY_AUTHOR)
		);
		return image;
	}
}

rhit.fbSingleImageManager = class {
	constructor(imageID) {
	  this._documentSnapshot = {};
	  this._unsubscribe = null;
	  this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_IMAGE).doc(imageID);
	}
	beginListening(changeListener) {

		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if(doc.exists) {
				this._documentSnapshot = doc;	
				changeListener();
			} else {

			}
		});
	}
	stopListening() {
	  this._unsubscribe();
	}
	update(caption) {
		this._ref.update({
			[rhit.FB_KEY_CAPTION]: caption
		})
		.then(function () {
		})
		.catch(function (error) {
			console.error("Error ", error);
		});
	}
	delete() {
		return this._ref.delete();
	}

	get image() {
		return this._documentSnapshot.get(rhit.FB_KEY_IMAGE);
	}

	get caption() {
		return this._documentSnapshot.get(rhit.FB_KEY_CAPTION);
	}

	get author() {
		return this._documentSnapshot.get(rhit.FB_KEY_AUTHOR);
	}
}

rhit.ListPageController = class {
	constructor() {
		document.querySelector("#menuShowAllImages").onclick = (event) => {
			window.location.href = "/list.html";
		};
		document.querySelector("#menuShowMyImages").onclick = (event) => {
			window.location.href = `list.html?uid=${rhit.FbAuthManager.uid}`;
		};
		document.querySelector("#menuSignOut").onclick = (event) => {
			rhit.FbAuthManager.signOut();
		};
		document.querySelector("#submitAddImage").onclick = (event) => {
			const image = document.querySelector("#inputImage").value;
			const caption = document.querySelector("#inputCaption").value;
			rhit.fbImageManager.add(image, caption);
		};
		$("#addImageDialog").on("show.bs.modal", (event) => {
			document.querySelector("#inputImage").value;
			document.querySelector("#inputCaption").value;
		});
		$("#addImageDialog").on("shown.bs.modal", (event) => {
			document.querySelector("#inputImage").focus();
		});

		rhit.fbImageManager.beginListening(this.updateList.bind(this));
	}

	updateList() {
		const newList = htmlToElement('<div id="imageListContainer"></div>');
		const urlParams = new URLSearchParams(window.location.search);

		for(let i = 0; i < rhit.fbImageManager.length; i++) {
			const img = rhit.fbImageManager.getImageatIndex(i);
			const newCard = this._createCard(img);

			newCard.onclick = (event) => {
				window.location.href = `/image.html?id=${img.id}`
			};

			const uid = urlParams.get("uid");
			if(uid == null) {
				newList.appendChild(newCard);
			} else if(img.author == uid) {
				newList.appendChild(newCard);
			}
		}

		const oldList = document.querySelector("#imageListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
	}

	_createCard(image) {
		return htmlToElement(`<div class="card">
        <div class="card-body">
          <img src="${image.image}" alt="" class="card-title"></img>
          <h6 class="card-subtitle mb-2 text-muted">${image.caption}</h6>
        </div>
      </div>`);
	}
}

rhit.DetailPageController = class {
	constructor() {
		document.querySelector("#menuSignOut").onclick = (event) => {
			rhit.FbAuthManager.signOut();
		};
		document.querySelector("#submitCaption").onclick = (event) => {
			const caption = document.querySelector("#inputCaption").value;
			rhit.fbSingleImageManager.update(caption);
		};
		$("#editCaptionDialog").on("show.bs.modal", (event) => {
			document.querySelector("#inputCaption").value = rhit.fbSingleImageManager.caption;
		});
		$("#editCaptionDialog").on("shown.bs.modal", (event) => {
			document.querySelector("#inputCaption").focus();
		});

		document.querySelector("#submitDeleteImage").onclick = (event) => {
			rhit.fbSingleImageManager.delete().then(function () {
				window.location.href = "/list.html";
			}).catch(function (error) {

			});
		};

		rhit.fbSingleImageManager.beginListening(this.updateView.bind(this));
	}
	updateView() {  
		document.querySelector("#cardImage").src = rhit.fbSingleImageManager.image;
		document.querySelector("#cardCaption").innerHTML = rhit.fbSingleImageManager.caption;

		if(rhit.fbSingleImageManager.author == rhit.FbAuthManager.uid) {
			document.querySelector("#menuEdit").style.display = "flex";
			document.querySelector("#menuDelete").style.display = "flex";
		}
	}
}

rhit.checkForRedirects = function() {
	if(document.querySelector("#loginPage") && rhit.FbAuthManager.isSignedIn) {
		window.location.href = "/list.html"
	}
	if(!document.querySelector("#loginPage") && !rhit.FbAuthManager.isSignedIn) {
		window.location.href = "/";
	}
}   

rhit.intializePage = function() {
	const urlParams = new URLSearchParams(window.location.search);
	if(document.querySelector("#listPage")) {
		const uid = urlParams.get("id");
		rhit.fbImageManager = new rhit.fbImageManager(uid);
		new rhit.ListPageController();
	}
	if(document.querySelector("#detailPage")) {
		const uid = urlParams.get("id");
		rhit.fbSingleImageManager = new rhit.fbSingleImageManager(uid);
		new rhit.DetailPageController();
	}
}

rhit.startFirebaseUI = function() {

	var uiConfig = {
        signInSuccessUrl: '/',
        signInOptions: [
          firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          firebase.auth.EmailAuthProvider.PROVIDER_ID,
          firebase.auth.PhoneAuthProvider.PROVIDER_ID,
          firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
        ],
      };

	  var ui = new firebaseui.auth.AuthUI(firebase.auth());
    
	
	  ui.start('#firebaseui-auth-container', uiConfig);
}

rhit.main = function () {
	rhit.FbAuthManager = new rhit.FbAuthManager();

	rhit.FbAuthManager.beginListening(() => {
		rhit.checkForRedirects();
		rhit.intializePage();
	});

	rhit.startFirebaseUI();
	if(document.querySelector("#loginPage")) {
		new rhit.LoginPageController();
	}

}

rhit.main();