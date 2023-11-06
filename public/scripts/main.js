var rhit = rhit || {};

rhit.FB_COLLECTION_BILL = "Bills";
rhit.FB_COLLECTION_INDIVIDUAL = "Individuals";
rhit.FB_COLLECTION_GROUP = "Groups";
rhit.FB_KEY_NAME = "name";
rhit.FB_KEY_DESCRIPTION = "description";
rhit.FB_KEY_AMOUNT = "amount";
rhit.FB_KEY_FROM = "from";
rhit.FB_KEY_PICTURE = "picture";
rhit.FB_KEY_FUNDS = "funds";
rhit.FB_KEY_INDIVIDUALS = "individuals";


rhit.fbAccountManager = null;
rhit.AccountPageController = null;

//rhit.fbFinanceManager      ------>
//rhit.FinancePageController ------>
//rhit.fbExpenseManager      ------>
//rhit.ExpensePageController ------>
//rhit.fbAccountManager      ------>
//rhit.AccountPageController ------>

rhit.FinancePageController = class {
  constructor() {

  }
  updateBills() {

  }
  _createBill() { // could be unnecessary

  }
}

rhit.fbFinanceManager = class {

}
rhit.ExpensePageController = class {
  constructor() {

  }
  updateBills() {

  }
  _createBill() { // could be unnecessary

  }
}
rhit.fbExpenseManager = class {

}
rhit.AccountPageController = class {
  constructor() {
    document.querySelector("#signOut").onclick = (event) => {
      rhit.fbAuthManager.signOut();
    }
  }
  updateBills() {

  }
  _createBill() { // could be unnecessary

  }
}

rhit.Account = class {
  constructor(funds, name, picture) {
    this.funds = funds;
    this.name = name;
    this.picture = picture;
  }
}
rhit.fbAccountManager = class {
  constructor(user) {
    this._unsubscribe = null;
    this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_INDIVIDUAL).doc(user.uid); //uid is the username such as freelahr
    this._documentSnapshot = {};
  }

  beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if(doc.exists) {
				this._documentSnapshot = doc;	
				console.log(this.quote);
				changeListener();
			} else {

			}
		});
	}
  stopListening() {
	  this._unsubscribe();
	}
  update(name, picture, funds) {
    this._ref.update({
			[rhit.FB_KEY_FUNDS]: funds,
			[rhit.FB_KEY_NAME]: name,
			[rhit.FB_KEY_PICTURE]: picture,
		})
		.then(function () {
		})
		.catch(function (error) {
			console.error("Error ", error);
		});
  }
}
 
rhit.LoginPageController = class {
  constructor() {
    document.querySelector("#rosefireButton").onclick = (event) => {
      rhit.fbAuthManager.signIn();
    };
  }
}
 
rhit.fbAuthManager = class {
  constructor() {
    this._user = null;
  }
 
  beginListening(changeListener) {
    firebase.auth().onAuthStateChanged((user) => {
      this._user = user;
      changeListener();
    });
  }
 
  signIn() {
    console.log("Sign in using Rosefire");
    Rosefire.signIn("d419f334-d32e-4faa-b9ec-b436cffd442e", (err, rfUser) => {
      if (err) {
        console.log("Rosefire error!", err);
        return;
      }
      console.log("Rosefire success!", rfUser);
      firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        if (errorCode === 'auth/invalid-custom-token') {
          alert('The token you provided is not valid.');
        } else {
          console.error("Custom auth error", errorCode, errorMessage);
        }
      });
    });
  }
 
  signOut() {
    firebase.auth().signOut().then(() => {
      console.log("You are now signed out");
    }).catch((error) => {
      console.log("Sign out error");
    });
  }
  get isSignedIn() {
    return !!this._user;
  }
  get uid() {
    return this._user.uid;
  }
  get user() {
    return this._user;
  }
}
 
rhit.checkForRedirects = function () {
  if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
    window.location.href = "/finance.html"
  }
 
  if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
    window.location.href = "/"
  }
}
 
rhit.initializePage = function () {
  if(rhit.fbAuthManager.isSignedIn) {
    rhit.fbAccountManager = new rhit.fbAccountManager(rhit.fbAuthManager.user);
  }
  if (document.querySelector("#financePage")) {
    rhit.fbFinanceManager = new rhit.fbFinanceManager();
    new rhit.FinancePageController();
  }
 
  if (document.querySelector("#expensePage")) {
    rhit.fbExpenseManager = new rhit.fbExpenseManager();
    new rhit.ExpensePageController();
  }
 
  if (document.querySelector("#accountPage")) {
    new rhit.AccountPageController();
  }
}

rhit.main = function () {
	console.log("Ready");
	rhit.fbAuthManager = new rhit.fbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);
		rhit.checkForRedirects();
		rhit.initializePage();
	});
  if (document.querySelector("#loginPage")) {
    new rhit.LoginPageController();
  }
};

rhit.main();

    // ref = firebase.firestore().collection(rhit.FB_COLLECTION_INDIVIDUAL);
    // console.log(ref);
    // ref.doc("test").set({
    //   [rhit.FB_KEY_FUNDS]: 20,
    //   [rhit.FB_KEY_NAME]: "Hunter",
    //   [rhit.FB_KEY_PICTURE]: "hello",
    // });

    // ref.doc("test").collection(rhit.FB_COLLECTION_BILL).add({
    //   [rhit.FB_KEY_AMOUNT]: 25,
    //   [rhit.FB_KEY_FROM]: "Hunter",
    // });