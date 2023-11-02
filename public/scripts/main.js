var rhit = rhit || {};

rhit.FB_COLLECTION_BILL = "bill";
rhit.FB_COLLECTION_INDIVIDUAL = "individual";
rhit.FB_COLLECTION_GROUP = "group";
rhit.FB_KEY_NAME = "name";
rhit.FB_KEY_DESCRIPTION = "description";
rhit.FB_KEY_AMOUNT = "amount";
rhit.FB_KEY_FROM = "from";

rhit.main = function () {
    const exampleModal = document.getElementById('exampleModal')
exampleModal.addEventListener('show.bs.modal', event => {
  // Button that triggered the modal
  const button = event.relatedTarget
  // Extract info from data-bs-* attributes
  const recipient = button.getAttribute('data-bs-whatever')
  // If necessary, you could initiate an AJAX request here
  // and then do the updating in a callback.
  //
  // Update the modal's content.
  const modalTitle = exampleModal.querySelector('.modal-title')
  const modalBodyInput = exampleModal.querySelector('.modal-body input')

  modalTitle.textContent = `New message to ${recipient}`
  modalBodyInput.value = recipient
})
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
    title: 'MY FINANCES',
    fontName: 'Roboto',
    legend: {position: 'top', maxLines: '2'}
  };
  var chart = new google.visualization.PieChart(document.getElementById('piechart'));
  chart.draw(data, options);
}

rhit.main();