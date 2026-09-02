import { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ruLocale = {
  localize: {
    month: (n) => [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ],
    day: (n) => [
      'Воскресенье', 'Понедельник', 'Вторник', 'Среда',
      'Четверг', 'Пятница', 'Суббота'
    ],
    ordinalNumber: (n) => n,
    era: (n) => ['до н.э.', 'н.э.'],
    quarter: (n) => ['1 квартал', '2 квартал', '3 квартал', '4 квартал'],
    dayPeriod: (n) => (n === 'am' ? 'AM' : 'PM'),
  },
  formatLong: {
    date: () => 'dd.MM.yyyy',
    time: () => 'HH:mm:ss',
    dateTime: () => 'dd.MM.yyyy HH:mm:ss',
  },
};

registerLocale('ru', ruLocale);