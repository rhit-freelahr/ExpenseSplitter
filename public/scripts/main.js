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
rhit.FB_KEY_ID = "id";


rhit.fbAccountManager = null;
rhit.AccountPageController = null;

//rhit.fbFinanceManager      ------>
//rhit.FinancePageController ------>
//rhit.fbExpenseManager      ------>
//rhit.ExpensePageController ------>
//rhit.fbAccountManager      ------>
//rhit.AccountPageController ------>


function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.fbIndividualManager = class {
  constructor() {
    this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_INDIVIDUAL);
    this._documentSnapshots = [];
    this._unsubscribe = null;
  }

  beginListening(changeListener) {
    let query = this._ref;
    this._unsubscribe = query.onSnapshot((querySnapshot) => {
      this._documentSnapshots = querySnapshot.docs;
      changeListener();
   });
  }
  stopListening() {   
		this._unsubscribe();
	}
  get length() {    
		return this._documentSnapshots.length;
	}
  getIndividualAtIndex(index) {  
		const docSnapshot = this._documentSnapshots[index];  
		const individual = new rhit.Individual(
      docSnapshot.get(rhit.FB_KEY_NAME),
      docSnapshot.get(rhit.FB_KEY_NAME),
      docSnapshot.get(rhit.FB_KEY_PICTURE),
		);
		return individual;
	}
}

rhit.Individual = class {
  constructor(funds, name, picture) {
    this.funds = funds;
    this.name = name;
    this.picture = picture
  }
}

rhit.FinancePageController = class {
  constructor() {
    document.querySelector("#deposit-button").onclick = (event) => {
      const funds = document.querySelector("#funds-field").value;
      rhit.fbAccountManager.updateFunds(funds)
    }
    document.querySelector("#withdraw-button").onclick = (event) => {
      const funds = document.querySelector("#funds-field").value;
      rhit.fbAccountManager.updateFunds(funds*-1)
    }
    rhit.fbAccountManager.beginListening(this.updateNavBar.bind(this));
    rhit.fbFinanceManager.beginListening(this.updateView.bind(this));
  }

  updateNavBar() {
    document.querySelectorAll("#current-balance").forEach((element) => element.innerHTML = `$${rhit.fbAccountManager.funds}`);
  }
  updateView() {
    const billList = htmlToElement('<div class="card-history"></div>');
    for(let i = 0; i < rhit.fbFinanceManager.length; i++) {
      const bill = rhit.fbFinanceManager.getBillAtIndex(i);
      const newcard = this._createBill(bill);
      billList.appendChild(newcard);
      }
    const oldList = document.querySelector(".card-history");
    oldList.removeAttribute("class");
    oldList.hidden = true;
    oldList.parentElement.appendChild(billList);
  }

  _createBill(bill) {
      return htmlToElement(
        `<div class="card-columns">
        <div class="card" id="finance-card">
          <div class="card-body">
            <h5 class="card-title">${bill.from}</h5>
            <p class="card-text"><small class="text-muted">${bill.description}</small></p>
          </div>
          <div class="card-amount">
            <hr class="vl" id="bill-vl">
            <p class="amount" id="bill-amount">$${bill.amount}</p>
          </div>
        </div>
      </div>`
      );
    }  
  }

rhit.fbFinanceManager = class {
  constructor() {
    this._refBill = firebase.firestore().collection(rhit.FB_COLLECTION_INDIVIDUAL).doc(rhit.fbAuthManager.uid).collection(rhit.FB_COLLECTION_BILL);

    this._documentSnapshotsBill = [];

    this._unsubscribe = null;
  }
  beginListening(changeListener) {
    let query = this._refBill;
    this._unsubscribe = query.onSnapshot((querySnapshot) => {
      this._documentSnapshotsBill = querySnapshot.docs;
      changeListener();
   });
  }
  stopListening() {   
		this._unsubscribe();
	}
  get length() {    
		return this._documentSnapshotsBill.length;
	}
  getBillAtIndex(index) {  
		const docSnapshot = this._documentSnapshotsBill[index];  
		const bill = new rhit.Bill(
      docSnapshot.get(rhit.FB_KEY_AMOUNT),
			docSnapshot.get(rhit.FB_KEY_DESCRIPTION),
			docSnapshot.get(rhit.FB_KEY_FROM),
		);
		return bill;
	}
}

rhit.Bill = class {
  constructor(amount, description, from) {
    this.amount = amount;
    this.description = description;
    this.from = from;
  }
}

rhit.ExpensePageController = class {
  constructor() {

    document.querySelector("#group-confirm").onclick = (event) => {
      const individuals = document.querySelector("#group-individuals-list").value;
      const groupMembers = individuals.split(',');
      groupMembers.push(rhit.fbAuthManager.uid);
      const name = document.querySelector("#group-name").value;
      const description = document.querySelector("#group-description").value;
      const picture = document.querySelector("#group-picture").value;
      rhit.fbExpenseManager.add(name, description, groupMembers, picture);
    }

    document.querySelector("#deposit-button").onclick = (event) => {
      const funds = document.querySelector("#funds-field").value;
      rhit.fbAccountManager.updateFunds(funds)
    }
    document.querySelector("#withdraw-button").onclick = (event) => {
      const funds = document.querySelector("#funds-field").value;
      rhit.fbAccountManager.updateFunds(funds*-1)
    }
    
    rhit.fbAccountManager.beginListening(this.updateNavBar.bind(this));
    rhit.fbExpenseManager.beginListening(this.updateGroupList.bind(this));
    rhit.fbIndividualManager.beginListening(this.updateIndividualList.bind(this));
  }

  updateNavBar() {
    document.querySelectorAll("#current-balance").forEach((element) => element.innerHTML = `$${rhit.fbAccountManager.funds}`);
  }

  async updateGroupList() {
    const groupList = htmlToElement('<div class="card-groups"></div>');
    for(let i = 0; i < rhit.fbExpenseManager.length; i++) {
      const group = rhit.fbExpenseManager.getGroupAtIndex(i);
      const id = rhit.fbAuthManager.uid;
      if(this.inGroup(id,group)) {
        const newcard = await this._createGroup(group);
        groupList.appendChild(newcard);
        newcard.addEventListener("click", (event) => this.groupCardEventListeners(group, event.currentTarget.id)); 
      }
    }
    const oldList = document.querySelector(".card-groups");
    oldList.removeAttribute("class");
    oldList.hidden = true;
    oldList.parentElement.appendChild(groupList);
  }

  inGroup(id, group) {
    return group.individuals.includes(id);
  }

  async _createGroup(group) {
    return htmlToElement(
      `<button class="card-button" data-bs-toggle="modal" data-bs-target="#editExpenseModal" data-bs-whatever="@mdo" id="${group.id}">
        <div class="card-columns">
          <div class="card" id="expense-card">
            <div class="card-image">
              <img class="card-img-top" src="${group.picture}" alt="Group Image">
            </div>
            <div class="card-body">
              <h5 class="card-title">${group.name}</h5>
              <p class="card-text"><small class="text-muted">${group.description.slice(0,20) + (group.description.length > 20 ? "..." : "")}</small></p>
            </div>
            <div class="card-amount">
              <p class="amount">$${await this.totalAmount(group.id)}</p>
            </div>
          </div>
        </div>
      </button>`
    );
  }

  async updateIndividualList() {
    const individualList = htmlToElement('<div class="card-individuals"></div>');
    for(let i = 0; i < rhit.fbIndividualManager.length; i++) {
      const individual = rhit.fbIndividualManager.getIndividualAtIndex(i);
      const id = rhit.fbAuthManager.uid;
      const newcard = await this._createIndividual(individual);
      individualList.appendChild(newcard);
    }
    const oldList = document.querySelector(".card-individuals");
    oldList.removeAttribute("class");
    oldList.hidden = true;
    oldList.parentElement.appendChild(individualList);
  }

  async _createIndividual(individual) {
    return htmlToElement(
      `<button class="card-button" data-bs-toggle="modal" data-bs-target="#editExpenseModal" data-bs-whatever="@mdo">
      <div class="card-columns">
        <div class="card" id="expense-card">
          <div class="card-image">
            <img class="card-img-top" src="${individual.picture}" alt="Card image cap">
          </div>
          <div class="card-body">
            <h5 class="card-title">${individual.name}</h5>
          </div>
          <div class="card-amount">
            <p class="amount">$${await this.totalAmount(individual)}</p>
          </div>
        </div>
      </div>
    </button>
      `
    )
  }

  async totalAmount(id) {
    const ref = firebase.firestore().collection(rhit.FB_COLLECTION_INDIVIDUAL).doc(rhit.fbAuthManager.uid).collection(rhit.FB_COLLECTION_BILL).get();
    let result = await ref.then((snapshot) => {
      let total = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if(id == data.id) {
          total += data.amount;
        }
      });
      return total;
    });
    return result;
  }

  groupCardEventListeners(group, id) {
    document.querySelector("#sendBill").onclick = (event) => {
      const individuals = document.querySelector("#add-expense-recipients").value;
      const groupMembers = individuals.split(',');
      const description = document.querySelector("#add-expense-description").value;
      const amount = document.querySelector("#add-expense-amount").value;
      groupMembers.forEach((member) => {
        let amountforEach = amount/groupMembers.length;

        this._createBill(amountforEach, group.name, member, description, id);
      });
    }

    const ref = firebase.firestore().collection(rhit.FB_COLLECTION_GROUP).doc(id).get();
    ref.then(snap => {
      const data = snap.data();
      document.querySelector("#addExpensebutton").onclick = (event) => {
        document.querySelector("#add-expense-recipients").defaultValue = data.individuals.toString();
    }
  });
  }

  updateBills() {
  }

  _createBill(amount, from, member, description, id) {
    const ref = firebase.firestore().collection(rhit.FB_COLLECTION_INDIVIDUAL).doc(member).collection(rhit.FB_COLLECTION_BILL);
    ref.add({
      [rhit.FB_KEY_AMOUNT]: amount,
      [rhit.FB_KEY_FROM]: from,
      [rhit.FB_KEY_DESCRIPTION]: description,
      [rhit.FB_KEY_ID]: id,
    });
  }
}

rhit.Group = class {
  constructor(description, individuals, name, picture, id) {
    this.description = description;
    this.individuals = individuals;
    this.name = name;
    this.picture = picture;
    this.id = id
  }
}

rhit.fbExpenseManager = class {
  constructor() {
    this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_GROUP);
    this._documentSnapshots = [];
    this._unsubscribe = null;
  }

  add(name, description, individuals, picture) {
    const ref = this._ref.doc();
    ref.set({
      [rhit.FB_KEY_DESCRIPTION]: description,
      [rhit.FB_KEY_INDIVIDUALS]: individuals,
      [rhit.FB_KEY_NAME]: name,
      [rhit.FB_KEY_PICTURE]: picture,
      [rhit.FB_KEY_ID]: ref.id
    });
  }
  beginListening(changeListener) {
    let query = this._ref;
    this._unsubscribe = query.onSnapshot((querySnapshot) => {
      this._documentSnapshots = querySnapshot.docs;
      changeListener();
   });
  }
  stopListening() {   
		this._unsubscribe();
	}
  get length() {    
		return this._documentSnapshots.length;
	}
  getGroupAtIndex(index) {  
		const docSnapshot = this._documentSnapshots[index];  
		const group = new rhit.Group(
			docSnapshot.get(rhit.FB_KEY_DESCRIPTION),
			docSnapshot.get(rhit.FB_KEY_INDIVIDUALS),
      docSnapshot.get(rhit.FB_KEY_NAME),
      docSnapshot.get(rhit.FB_KEY_PICTURE),
      docSnapshot.get(rhit.FB_KEY_ID),
		);
		return group;
	}
}

rhit.AccountPageController = class {
  constructor() {
    document.querySelector("#signOut").onclick = (event) => {
      rhit.fbAuthManager.signOut();
    }
    document.querySelector("#submitChangeName").onclick = (event) => {
      const name = document.querySelector("#account-name").value;
      rhit.fbAccountManager.updateName(name);
    }
    document.querySelector("#submitChangeProfilePicture").onclick = (event) => {
      const profile = document.querySelector("#account-picture").value;
      rhit.fbAccountManager.updatePicture(profile);
    }
    document.querySelector("#deposit-button").onclick = (event) => {
      const funds = document.querySelector("#funds-field").value;
      rhit.fbAccountManager.updateFunds(funds)
    }
    document.querySelector("#withdraw-button").onclick = (event) => {
      const funds = document.querySelector("#funds-field").value;
      rhit.fbAccountManager.updateFunds(funds*-1)
    }

    rhit.fbAccountManager.beginListening(this.updateAccount.bind(this));
  }

  updateAccount() {
    document.querySelectorAll("#current-balance").forEach((element) => element.innerHTML = `$${rhit.fbAccountManager.funds}`);
  }
}

rhit.fbAccountManager = class {
  constructor() {
    this._unsubscribe = null;
    this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_INDIVIDUAL).doc(rhit.fbAuthManager.uid); //uid is the username such as freelahr
    this._documentSnapshot = {};
  }

  beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if(doc.exists) {
				this._documentSnapshot = doc;
				changeListener();
			} else {
        this._ref.set({
          [rhit.FB_KEY_FUNDS]: 0,
          [rhit.FB_KEY_NAME]: rhit.fbAuthManager.uid,
          [rhit.FB_KEY_PICTURE]: "https://www.getfoundquick.com/wp-content/uploads/2014/01/Capture-1.jpg", 
        });
			}
		});
	}
  stopListening() {
	  this._unsubscribe();
	}
  updateName(name) {
    this._ref.update(rhit.FB_KEY_NAME, name)
		.then(function () {
		})
		.catch(function (error) {
			console.error("Error ", error);
		});
  }
  updateFunds(funds) {
    this._ref.update(rhit.FB_KEY_FUNDS, +this.funds + +funds)
		.then(function () {
		})
		.catch(function (error) {
			console.error("Error ", error);
		});
  }
  updatePicture(picture) {
    this._ref.update(rhit.FB_KEY_PICTURE, picture)
		.then(function () {
		})
		.catch(function (error) {
			console.error("Error ", error);
		});
  }

  get funds() {
    return this._documentSnapshot.get(rhit.FB_KEY_FUNDS);
  }

  get name() {
    return this._documentSnapshot.get(rhit.FB_KEY_NAME);
  }

  get picture() {
    return this._documentSnapshot.get(rhit.FB_KEY_PICTURE);
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
    rhit.fbIndividualManager = new rhit.fbIndividualManager();
    rhit.fbExpenseManager = new rhit.fbExpenseManager();
  }
  if (document.querySelector("#financePage")) {
    rhit.fbFinanceManager = new rhit.fbFinanceManager();
    new rhit.FinancePageController();
  }
 
  if (document.querySelector("#expensePage")) {
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