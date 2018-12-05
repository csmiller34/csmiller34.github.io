$(function(){
  var currencies = [
    { value: 'Jeff Cooper', data: 'AFN' },
    { value: 'Souvik Dutta', data: 'ALL' },
    { value: 'Andrew Richards', data: 'DZD' },
    { value: 'Drew Roberts', data: 'EUR' },
    { value: 'Jim Hartling', data: 'AOA' },
    { value: 'Mike Ancell', data: 'XCD' },
    { value: 'Mike Toohey', data: 'ARS' },
  ];
  
  // setup autocomplete function pulling from currencies[] array
  $('#autocomplete').autocomplete({
    lookup: currencies,
    onSelect: function (suggestion) {
      var thehtml = '<strong>Currency Name:</strong> ' + suggestion.value + ' <br> <strong>Symbol:</strong> ' + suggestion.data;
      $('#outputcontent').html(thehtml);
    }
  });
  

});