const strCon: {
  common: { [key: string]: string };
  error?: { [key: string]: string };
  success?: { [key: string]: string };
} = {
  common: { fine: 'NO_FINE' },
  error: {
    start: 'CAR CANNOT BE BOOKED',
    startLowPeriod: "3 DAYS DIDN'T PASS. CAR CANNOT BE BOOKED",
    startOnWeekend: "CAN'T START SESSION ON WEEKAND - NOBODY IN OFFICE",
    startCarIsNotFree: 'CAR IS BOOKED',
    startCarIsNotFound: "CAR DOESN'T EXISTS",
    closeSessionNotFound: 'ACTIVE SESSION NOT FOUND',
    close30DayLimitPassed: 'SESSION LAST MORE THAN 30 DAYS.',
    closeOnWeekend: "CAN'T CLOSE SESSION ON WEEKAND - NOBODY IN OFFICE",
    closeOverTax: 'AVERAGE MILEAGE MORE THAN 500. FINED',
  },
  success: {
    startDateNotWeekend: 'DAY IS NOT WEEKEND. CAR CAN BE BOOKED',
    startDate3DayRange: '3 DAYS PASSED. CAR CAN BE BOOKED',
    start: 'SUCCESSFUL SESSION START',
    closeDateNotWeekend: 'DAY IS NOT WEEKEND. SESSION CAN BE CLOSED',
    close30DayLimitNotPassed: '30 DAYS NOT PASSED.NO FINE',
    close: 'SUCCESSFUL SESSION CLOSE',
    closeOverTax: 'AVERAGE MILEAGE LESS 500. NO FINE',
    closedWithFines: 'SESSION CLOSE WITH FINES',
  },
};

export default strCon;
