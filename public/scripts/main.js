var rhit = rhit || {};

rhit.FB_COLLECTION_BILL = "bill";
rhit.FB_COLLECTION_INDIVIDUAL = "individual";
rhit.FB_COLLECTION_GROUP = "group";
rhit.FB_KEY_NAME = "name";
rhit.FB_KEY_DESCRIPTION = "description";
rhit.FB_KEY_AMOUNT = "amount";
rhit.FB_KEY_FROM = "from";


rhit.main = function () {
 
}

// Piechart script: documentation @ https://developers.google.com/chart/interactive/docs/gallery/piechart
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);
function drawChart() {
  var data = google.visualization.arrayToDataTable([
  ['Expense', 'Amount Owed'], ['GROCERIES', 20],
  ['FAST FOOD', 10], ['TRIP', 50],
  ['GAMES', 10], ['SNACKS', 15]
  ]);
  var options = {
    fontName: 'Roboto',
    legend: {position: 'top', maxLines: '2'}
  };
  var chart = new google.visualization.PieChart(document.getElementById('piechart'));
  chart.draw(data, options);
}

//rhit.fbFinanceManager ------>
 
//rhit.fbExpenseManager ------>
 
//rhit.fbAccountManager ------>
 
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
  const urlParams = new URLSearchParams(window.location.search);
  if (document.querySelector("#financePage")) {
    const uid = urlParams.get("uid");
    rhit.fbFinanceManager = new rhit.fbFinanceManager(uid);
    new rhit.ListPageController();
  }
 
  if (document.querySelector("#expensePage")) {
    const captionId = urlParams.get("id");
    if (!captionId) {
      window.location.href = "/";
    }
    rhit.fbExpenseManager = new rhit.fbExpenseManager(captionId);
    new rhit.PhotoPageController();
  }
 
  if (document.querySelector("#accountPage")) {
    const captionId = urlParams.get("id");
    if (!captionId) {
      window.location.href = "/";
    }
    rhit.fbAccountManager = new rhit.fbAccountManager(captionId);
    new rhit.PhotoPageController();
  }
  if (document.querySelector("#loginPage")) {
    new rhit.LoginPageController();
  }
}

rhit.main();