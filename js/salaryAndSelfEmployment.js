(function () {
  // Create the connector object
  var myConnector = tableau.makeConnector();

  // Define the schema
  myConnector.getSchema = function (schemaCallback) {
    var cols = [{
        id: "id",
        dataType: tableau.dataTypeEnum.int,
      },
      {
        id: "login",
        dataType: tableau.dataTypeEnum.string,
      },
      {
        id: "date",
        alias: "Year and month",
        dataType: tableau.dataTypeEnum.string,
      },
      {
        id: "currency",
        alias: "Salary currency",
        dataType: tableau.dataTypeEnum.string,
      },
      {
        id: "efforts",
        alias: "efforts",
        dataType: tableau.dataTypeEnum.int,
      },
      {
        id: "total",
        alias: "total",
        dataType: tableau.dataTypeEnum.string,
      },
    ];

    var tableSchema = {
      id: "Salary_And_Self_Employment",
      alias: "Salary and Self Employment",
      columns: cols
    };

    schemaCallback([tableSchema]);
  };

  const SALARY_API_KEY = "123";
  const EMPLOYEE_API_KEY = "123";
  const SALARY_URL = `http://sv-dev.noveogroup.com/api/getPayments?token=${SALARY_API_KEY}&`;
  const EMPLOYEE_URL = `https://se-demo.noveogroup.com/api/getPayments?token=${EMPLOYEE_API_KEY}&`;
   //var BASE_URL = `http://sv-dev.noveogroup.com/api/getPayments?token=${API_KEY}&`;
   //const BASE_URL = `https://se-demo.noveogroup.com/api/getPayments?token=${API_KEY}&`;
  // var SALARY_URL ='../json/SalaryViewerConnectionData.json';
  // var EMPLOYEE_URL ='../json/SelfEmployeeConnectionData.json';

  var MONTH_MAP = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec"
  ];

  /**
   * Создает URL адрес для получения статистики за текущий промежуток.
   * @param {string} startDate 
   * @param {string} endDate 
   */
  const createURL = (startDate, endDate, url) => `${url}startDate=${startDate}&endDate=${endDate}`;
  //const createURL = () => `${BASE_URL}`;
  //const createURL = (startDate, endDate, url) => `${url}`;

  /**
   * Возвращает строковый вариант месяца по его порядковому номеру
   * @param {number} number 
   */
  // const getMonthIdByNumber = (number) => MONTH_MAP[number - 1];
  const getNumberByMonth = (month) => MONTH_MAP.indexOf(month)+1;

  /**
   * 
   * @param {object} row - Объект проекта, полученный из JSON.
   * @param {{
   *  year: number,
   *  month: number,
   *  yearIndex: number,
   * }} dateObject 
   */
  const transformToTableRows = (row, targetArray) => {
    const { id, login, payments } = row;

    if (payments) {
      for (let year in payments) {
        for (let month in payments[year]) {
          const {  'RUR':currency, efforts, accrued } = payments[year][month];
          const { total } = accrued;
          //const { cards_1, cards_2, cards_3, cards_4 } = paid_llc;
          //const { inc_1, inc_2, inc_overpaid, prepayment } = paid_inc;
          const monthNum = getNumberByMonth(month);
          const date = `${year}-${monthNum < 10 ? `0${monthNum}` : monthNum}-01`;
          
          const tRow = {
            id,
            login,
            //name,
            //surname,
            date,
            currency,
            efforts,
            //overpaid,
            //benefit, 
            //bonus, 
            //extra, 
            //medical_pay, 
            //salary, 
            //sick_pay, 
            total, 
            //vacation_pays,
            //cards_1, cards_2, cards_3, cards_4,
            //credit, inc_1, inc_2, inc_overpaid, prepayment,
          }
          targetArray.push(tRow);
        }  
      }
    } else {
      return false;
    }
  };

  /**
   * Создает объект dateObject. 
   * @param {number} index 
   * @param {string} startDate 
   */
  // const createDateObject = (index, startDate) => {
  //   var date = new Date(startDate);
  //   var startMonth = date.getMonth();
  //   var startYear = date.getFullYear();
  //   var newDate = new Date(startYear, startMonth + index, 1);

  //   var year = newDate.getFullYear();
  //   var month = newDate.getMonth() + 1;

  //   // В объекте projectObject поле sold это массив. yearIndex показывает какой порядковый
  //   // номер у текущего года в данном массиве.
  //   var yearIndex = year - startYear;

  //   return {
  //     year,
  //     month,
  //     yearIndex,
  //   };
  // };

  /**
   * Вычисляет количество месячных периодов между startDate и endDate.
   * Создает массив объектов, которые будут использованы для создания запросов на сервер.
   * @param {string} startDate
   * @param {string} endDate
   * @returns {
   *  id: number,
   *  startDate: string,
   *  endDate: string,
   * }[],
   */
  // var createDatesArray = (startDate, endDate) => {
  //   var datesArray = [];
  //   var start = new Date(startDate);
  //   var end = new Date(endDate);
  //   var basicMonthDiff = (end.getFullYear() - start.getFullYear()) * 12 + 1;
  //   basicMonthDiff -= start.getMonth();
  //   basicMonthDiff += end.getMonth();
  //   for (var index = 0; index < basicMonthDiff; index++) {
  //     datesArray.push(createDateObject(index, startDate));
  //   }

  //   return datesArray;
  // };

  // Download the data
  myConnector.getData = function (table, doneCallback) {
    var {
      startDate,
      endDate
    } = JSON.parse(tableau.connectionData);

    let _tableData = [];

    $.getJSON(createURL(startDate, endDate, SALARY_URL), function (jsonData) {
      const { employees } = jsonData;
      let arr = [];
      
      employees.forEach((row) => {
        transformToTableRows(row, arr);
      });
      _tableData = [..._tableData, ...arr];
    });

    $.getJSON(createURL(startDate, endDate, EMPLOYEE_URL), function (jsonData) {
      const { employees } = jsonData;
      let arr = [];
      
      employees.forEach((row) => {
        transformToTableRows(row, arr);
      });
      _tableData = [..._tableData, ...arr];

      _tableData = _tableData.sort((a, b) => (Date.parse(a.date) - Date.parse(b.date)));
      
      table.appendRows(_tableData);
      doneCallback();
    });
  };

  tableau.registerConnector(myConnector);

  // Create event listeners for when the user submits the form
  $(document).ready(function () {
    $('.month-picker__input').datepicker();
    $("#submitButton").click(function () {
      const errorAlert = $('body #errorMsg');
      if (errorAlert.length > 0) {
        errorAlert.remove();
      }
      var dateObj = {
        startDate: $('#startDate').val().trim(),
        endDate: $('#endDate').val().trim(),
      };

      function isValidDate(dateStr) {
        var d = new Date(dateStr);
        return !isNaN(d.getDate());
      }

      if (isValidDate(dateObj.startDate) && isValidDate(dateObj.endDate)) {
        tableau.connectionData = JSON.stringify(dateObj);
        tableau.connectionName = "Salary and Employment";
        tableau.submit();
      } else {
        const errorMsg = `
          <div id="errorMsg" class="alert alert-danger" role="alert">
            Enter valid dates. For example, 2016-05-08.
          </div>
        `;
        $('#detailed-group').append(errorMsg);
      }
    });
  });
})();