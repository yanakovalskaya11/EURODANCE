import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// Day mapping constants
const dayNameToNumber = {
  'Пн': 1,
  'Вт': 2,
  'Ср': 3,
  'Чт': 4,
  'Пт': 5,
  'Сб': 6,
  'Вс': 0,
};

const numberToDayName = {
  1: 'Пн',
  2: 'Вт',
  3: 'Ср',
  4: 'Чт',
  5: 'Пт',
  6: 'Сб',
  0: 'Вс'
};

const TeacherChangeTimetable = ({ currentUser }) => {
  const [directions, setDirections] = useState([]);
  const [selectedDirectionId, setSelectedDirectionId] = useState("");
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [allTeachersSchedule, setAllTeachersSchedule] = useState([]);
  const [days, setDays] = useState([
    { day: "Пн", selected: false, time: "", availableTimes: [] },
    { day: "Вт", selected: false, time: "", availableTimes: [] },
    { day: "Ср", selected: false, time: "", availableTimes: [] },
    { day: "Чт", selected: false, time: "", availableTimes: [] },
    { day: "Пт", selected: false, time: "", availableTimes: [] },
    { day: "Сб", selected: false, time: "", availableTimes: [] },
    { day: "Вс", selected: false, time: "", availableTimes: [] },
  ]);
  const [selectedDayForSchedule, setSelectedDayForSchedule] = useState(null);
  const [daySchedule, setDaySchedule] = useState([]);

  const allowedLevels = ["начинающий", "продвинутый", "все уровни"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [directionsResponse, scheduleResponse] = await Promise.all([
          axios.get("http://localhost:5000/api/napravleniya"),
          axios.get("http://localhost:5000/api/teacher_schedule")
        ]);
        setDirections(directionsResponse.data);
        setAllTeachersSchedule(scheduleResponse.data);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      axios.get(`http://localhost:5000/api/teacher_types/${currentUser.id}`)
        .then((res) => {
          setTeacherAssignments(res.data);
          updateBusyTimes(res.data);
        })
        .catch((err) => console.error("Ошибка загрузки направлений учителя", err));
    } else {
      setTeacherAssignments([]);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (selectedDayForSchedule !== null) {
      const dayNumber = dayNameToNumber[selectedDayForSchedule];
      const scheduleForDay = allTeachersSchedule
        .filter(item => item.day === dayNumber)
        .sort((a, b) => a.time.localeCompare(b.time));
      setDaySchedule(scheduleForDay);
    }
  }, [selectedDayForSchedule, allTeachersSchedule]);

  const groupScheduleByTime = (schedule) => {
    const grouped = {};
    schedule.forEach(item => {
      if (!grouped[item.time]) {
        grouped[item.time] = [];
      }
      grouped[item.time].push(item);
    });
    return grouped; 
  };

  const updateBusyTimes = (assignments) => {
    const busy = {};
    assignments.forEach(assignment => {
      assignment.schedule.forEach(slot => {
        const dayName = numberToDayName[slot.day];
        if (!busy[dayName]) busy[dayName] = [];
        busy[dayName].push(slot.time);
      });
    });
  };

  const getBusyTimesForDay = (dayName) => {
    const dayNumber = dayNameToNumber[dayName];
    
    const currentTeacherBusy = teacherAssignments.flatMap(assignment => 
      assignment.schedule
        .filter(slot => slot.day === dayNumber)
        .map(slot => slot.time)
    );

    const allBusy = allTeachersSchedule
      .filter(item => item.day === dayNumber)
      .map(item => item.time);

    const busyTeachers = allTeachersSchedule
      .filter(item => item.day === dayNumber)
      .reduce((acc, item) => {
        if (!acc[item.time]) acc[item.time] = [];
        acc[item.time].push(`${item.teacher_name} (${item.subject_name})`);
        return acc;
      }, {});

    return { currentTeacherBusy, allBusy, busyTeachers };
  };

  const generateTimeSlots = (dayName) => {
    const { currentTeacherBusy, allBusy, busyTeachers } = getBusyTimesForDay(dayName);
    const slots = [];
    
    for (let hour = 10; hour < 22; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const isBusyCurrentTeacher = currentTeacherBusy.includes(time);
      const isBusyOtherTeachers = allBusy.includes(time) && !isBusyCurrentTeacher;
      
      slots.push({
        time,
        isBusyCurrentTeacher,
        isBusyOtherTeachers,
        busyTeachers: busyTeachers[time] || []
      });
    }
    
    return slots;
  };

  const toggleDaySelection = (index) => {
    const newDays = [...days];
    const dayName = newDays[index].day;
    newDays[index].selected = !newDays[index].selected;
    
    if (newDays[index].selected) {
      newDays[index].availableTimes = generateTimeSlots(dayName);
    } else {
      newDays[index].time = "";
    }
    setDays(newDays);
  };

  const handleTimeChange = (index, time) => {
    const newDays = [...days];
    newDays[index].time = time;
    setDays(newDays);
  };

const handleDeleteAssignment = async (teacherTypeId) => {
  if (!teacherTypeId) {
    toast.error("Не удалось определить ID направления для удаления");
    return;
  }

  if (window.confirm("Отправить запрос на удаление этого направления?")) {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/teacher/teacher_types/${teacherTypeId}`
      );
      
      toast.success(response.data.message || "Запрос на удаление отправлен администратору");
      
      const updated = await axios.get(
        `http://localhost:5000/api/teacher_types/${currentUser.id}`
      );
      setTeacherAssignments(updated.data);
      
    } catch (err) {
      console.error("Ошибка при удалении:", err);
      toast.error(err.response?.data?.error || "Не удалось отправить запрос на удаление");
    }
  }
};

const handleSubmit = async (event) => {
  event.preventDefault();

  if (!currentUser?.id) {
    toast.error("Не удалось определить преподавателя");
    return;
  }

  if (!selectedDirectionId || !selectedLevel) {
    toast.warn("Выберите направление и уровень");
    return;
  }

  // Проверяем выбранные дни
  const selectedDaysWithTime = days
    .filter((day) => day.selected && day.time)
    .map((day) => {
      const dayNumber = dayNameToNumber[day.day];
      if (dayNumber === undefined) {
        toast.error(`Некорректный день недели: ${day.day}`);
        throw new Error(`Invalid day: ${day.day}`);
      }
      return {
        day: dayNumber,
        time: day.time
      };
    });

  if (selectedDaysWithTime.length === 0) {
    toast.warn("Выберите хотя бы один день и укажите время");
    return;
  }

  try {
    // 1. Создаем новое направление
    const teacherTypeResponse = await axios.post("http://localhost:5000/api/teacher_types", {
      teacher_id: currentUser.id,
      napravleniya_id: selectedDirectionId,
      level: selectedLevel,
      is_active: false
    });

    const teacherTypeId = teacherTypeResponse.data.id;

    // 2. Добавляем дни расписания
    const dayPromises = selectedDaysWithTime.map((dayObj) => {
      return axios.post("http://localhost:5000/api/teacher_types/days", {
        teacher_type_id: teacherTypeId,
        day: dayObj.day,
        time: dayObj.time
      });
    });

    await Promise.all(dayPromises);
    
    const updated = await axios.get(`http://localhost:5000/api/teacher_types/${currentUser.id}`);
    
    setTeacherAssignments(updated.data);
    updateBusyTimes(updated.data);
    
    // Сбрасываем форму
    setSelectedDirectionId("");
    setSelectedLevel("");
    setDays(days.map((day) => ({ ...day, selected: false, time: "" })));
    
    toast.success("Расписание отправлено на утверждение администратору!");
  } catch (error) {
    console.error("Ошибка при сохранении:", error);
    toast.error(`Ошибка при сохранении: ${error.message}`);
  }
};

  return (
    <div className="dance-admin-container">
      <form onSubmit={handleSubmit} className="dance-form">
        {currentUser && (
          <div className="teacher-info glow-box">
            <h3 className="gradient-text">Ваш профиль преподавателя</h3>
            <p><strong>Имя:</strong> {currentUser.name} {currentUser.last_name}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            {currentUser.experience && <p><strong>Опыт:</strong> {currentUser.experience}</p>}
          </div>
        )}

        {teacherAssignments.length > 0 && (
          <div className="assignments-table glow-box">
            <h3 className="gradient-text">Ваше текущее расписание</h3>
            <table className="dance-table">
              <thead>
                <tr>
                  <th>Направление</th>
                  <th>Уровень</th>
                  <th>Дни и время</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {teacherAssignments.map((assignment) => (
                  <tr key={assignment.teacher_type_id}>
                    <td>{assignment.direction_name}</td>
                    <td>{assignment.level}</td>
                    <td>
                      {assignment.schedule.map((day, i) => (
                        <div key={i}>
                          {numberToDayName[day.day]} – {day.time}
                        </div>
                      ))}
                    </td>
                    
                    <td>
                      <button
                        type="button"
                        className="dance-btn delete-btn"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        disabled={assignment.is_approved}
                        title={assignment.is_approved ? "Утвержденные занятия нельзя удалить" : ""}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="form-section">
          <h3 className="gradient-text">Добавить новое занятие</h3>
          
          <div className="form-row">
            <div className="form-section">
              <label className="dance-label">Выберите направление:</label>
              <select
                value={selectedDirectionId}
                onChange={(e) => setSelectedDirectionId(e.target.value)}
                className="dance-select"
                required
              >
                <option value="">-- Выберите --</option>
                {directions.map((direction) => (
                  <option key={direction.id} value={direction.id}>
                    {direction.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-section">
              <label className="dance-label">Выберите уровень:</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="dance-select"
                required
              >
                <option value="">-- Выберите --</option>
                {allowedLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <label className="dance-label">Выберите дни и время занятий:</label>
            <div className="days-grid">
              {days.map((day, index) => (
                <div key={index} className={`day-card ${day.selected ? 'active' : ''}`}>
                  <label className="day-header">
                    <input
                      type="checkbox"
                      checked={day.selected}
                      onChange={() => toggleDaySelection(index)}
                      className="dance-checkbox"
                    />
                    <span>{day.day}</span>
                  </label>
                  
                  {day.selected && (
                    <div className="time-selection">
                      <label className="dance-label">Выберите время:</label>
                      <select
                        value={day.time}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                        required
                        className="dance-select time-select"
                      >
                        <option value="">-- Выберите время --</option>
                        {day.availableTimes
                          .filter(slot => !slot.isBusyCurrentTeacher)
                          .map((slot, i) => (
                            <option 
                              key={i} 
                              value={slot.time}
                              className={slot.isBusyOtherTeachers ? 'other-teacher-busy' : ''}
                              title={slot.isBusyOtherTeachers ? 
                                `Занято другими преподавателями: ${slot.busyTeachers.join(', ')}` : ''
                              }
                            >
                              {slot.time}
                              {slot.isBusyOtherTeachers && ' (занято)'}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="dance-btn submit-btn gradient-btn">
            Отправить на утверждение
          </button>
        </div>
      </form>

      <div className="day-schedule-section glow-box">
        <h3 className="gradient-text">Расписание на день</h3>
        <div className="day-selector">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day, index) => (
            <button
              key={index}
              className={`dance-btn day-btn ${selectedDayForSchedule === day ? 'active' : ''}`}
              onClick={() => setSelectedDayForSchedule(day)}
            >
              {day}
            </button>
          ))}
        </div>

        {selectedDayForSchedule && (
          <div className="schedule-table">
            <table className="dance-table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Преподаватель</th>
                  <th>Направление</th>
                  <th>Уровень</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupScheduleByTime(daySchedule)).map(([time, items]) => (
                  items.map((item, index) => (
                    <tr key={`${time}-${index}`}>
                      {index === 0 ? (
                        <td rowSpan={items.length}>{time}</td>
                      ) : null}
                      <td>{item.teacher_name}</td>
                      <td>{item.subject_name}</td>
                      <td>{item.level}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherChangeTimetable;