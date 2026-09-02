import React, { useEffect, useState } from "react";
import axios from "axios";
import "./type.css";
import { toast } from "react-toastify";

const Teacher_Types = () => {
  // Состояния для хранения данных
  const [teachers, setTeachers] = useState([]);
  const [directions, setDirections] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedDirectionId, setSelectedDirectionId] = useState("");
  const [selectedTeacherInfo, setSelectedTeacherInfo] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [teacherAssignments, setTeacherAssignments] = useState([]);
  const [pendingAddRequests, setPendingAddRequests] = useState([]); // Заявки на добавление
  const [pendingDeleteRequests, setPendingDeleteRequests] = useState([]); // Заявки на удаление
  const [allTeachersSchedule, setAllTeachersSchedule] = useState([]);
  
  // Состояния для работы с расписанием
  const [days, setDays] = useState([
    { day: "ПН", selected: false, time: "", availableTimes: [] },
    { day: "ВТ", selected: false, time: "", availableTimes: [] },
    { day: "СР", selected: false, time: "", availableTimes: [] },
    { day: "ЧТ", selected: false, time: "", availableTimes: [] },
    { day: "ПТ", selected: false, time: "", availableTimes: [] },
    { day: "СБ", selected: false, time: "", availableTimes: [] },
    { day: "ВС", selected: false, time: "", availableTimes: [] },
  ]);
  
  const [selectedDayForSchedule, setSelectedDayForSchedule] = useState(null);
  const [daySchedule, setDaySchedule] = useState([]);
  const [activeTab, setActiveTab] = useState("schedule"); // Активная вкладка

  // Допустимые уровни подготовки
  const allowedLevels = ["начинающий", "продвинутый", "все уровни"];

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Параллельная загрузка всех необходимых данных
        const [
          teachersResponse, 
          directionsResponse, 
          scheduleResponse, 
          addRequestsResponse,
          deleteRequestsResponse
        ] = await Promise.all([
          axios.get("http://localhost:5000/api/teachers"),
          axios.get("http://localhost:5000/api/napravleniya"),
          axios.get("http://localhost:5000/api/teacher_schedule"),
          axios.get("http://localhost:5000/api/teacher_types/pending"),
          axios.get("http://localhost:5000/api/teacher_types/deletion_requests")
        ]);
        
        // Обновление состояний
        setTeachers(teachersResponse.data);
        setDirections(directionsResponse.data);
        setAllTeachersSchedule(scheduleResponse.data);
        setPendingAddRequests(addRequestsResponse.data);
        setPendingDeleteRequests(deleteRequestsResponse.data);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      }
    };
    fetchData();
  }, []);

  // Загрузка направлений преподавателя при изменении выбранного преподавателя
  useEffect(() => {
    if (selectedTeacherId) {
      axios.get(`http://localhost:5000/api/teacher_types/${selectedTeacherId}`)
        .then((res) => {
          setTeacherAssignments(res.data);
          updateBusyTimes(res.data);
        })
        .catch((err) => console.error("Ошибка загрузки направлений учителя", err));
    } else {
      setTeacherAssignments([]);
    }
  }, [selectedTeacherId]);

  // Обновление расписания при изменении выбранного дня
  useEffect(() => {
    if (selectedDayForSchedule !== null) {
      const dayNumber = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"].indexOf(selectedDayForSchedule);
      const scheduleForDay = allTeachersSchedule
        .filter(item => item.day === dayNumber)
        .sort((a, b) => a.time.localeCompare(b.time));
      setDaySchedule(scheduleForDay);
    }
  }, [selectedDayForSchedule, allTeachersSchedule]);

  // Группировка расписания по времени
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
  if (!assignments) return; 
  
  const busy = {};
  assignments.forEach(assignment => {
    if (!assignment.schedule) return; 
    assignment.schedule.forEach(slot => {
      const dayName = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"][slot.day];
      if (!busy[dayName]) busy[dayName] = [];
      busy[dayName].push(slot.time);
    });
  });
};

  // Получение занятых времен для дня
  const getBusyTimesForDay = (dayName) => {
    const currentTeacherBusy = teacherAssignments.flatMap(assignment => 
      assignment.schedule
        .filter(slot => ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"][slot.day] === dayName)
        .map(slot => slot.time)
    );

    const allBusy = allTeachersSchedule
      .filter(item => ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"][item.day] === dayName)
      .map(item => item.time);

    const busyTeachers = allTeachersSchedule
      .filter(item => ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"][item.day] === dayName)
      .reduce((acc, item) => {
        if (!acc[item.time]) acc[item.time] = [];
        acc[item.time].push(`${item.teacher_name} (${item.subject_name})`);
        return acc;
      }, {});

    return { currentTeacherBusy, allBusy, busyTeachers };
  };

  // Генерация временных слотов для дня
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

  // Обработчик изменения выбранного преподавателя
  const handleTeacherChange = (e) => {
    const teacherId = e.target.value;
    setSelectedTeacherId(teacherId);
    const teacher = teachers.find((t) => String(t.id) === teacherId);
    setSelectedTeacherInfo(teacher || null);
  };

  // Переключение выбора дня
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

  // Обработчик изменения времени
  const handleTimeChange = (index, time) => {
    const newDays = [...days];
    newDays[index].time = time;
    setDays(newDays);
  };

  const handleDeleteAssignment = async (id) => {
    if (window.confirm("Подтвердить удаление этого направления?")) {
      try {
        await axios.delete(`http://localhost:5000/api/teacher_types/${id}/confirm_deletion`);
        toast.success("Направление полностью удалено");
        
        // Обновление списка направлений преподавателя
        const updated = await axios.get(`http://localhost:5000/api/teacher_types/${selectedTeacherId}`);
        setTeacherAssignments(updated.data);
      } catch (err) {
        console.error("Ошибка при удалении:", err);
        toast.error(err.response?.data?.error || "Не удалось удалить направление");
      }
    }
  };


const handleSubmit = async (event) => {
  event.preventDefault();

  if (!selectedTeacherId || !selectedDirectionId || !selectedLevel) {
    toast.warn("Выберите учителя, направление и уровень");
    return;
  }

  const selectedDaysWithTime = days
    .filter((day) => day.selected && day.time)
    .map((day) => ({ day: day.day.toUpperCase(), time: day.time }));

  if (selectedDaysWithTime.length === 0) {
    toast.warn("Выберите хотя бы один день и укажите время");
    return;
  }

  try {
    // 1. Создаем запись в teacher_types
    const teacherTypeResponse = await axios.post("http://localhost:5000/api/teacher_types", {
      teacher_id: selectedTeacherId,
      napravleniya_id: selectedDirectionId,
      level: selectedLevel,
      is_active: true
    });

    const teacherTypeId = teacherTypeResponse.data.id;

    // 2. Добавляем дни расписания
    const dayMapping = {
      "ПН": 1,
      "ВТ": 2,
      "СР": 3,
      "ЧТ": 4,
      "ПТ": 5,
      "СБ": 6,
      "ВС": 0
    };

    await Promise.all(
      selectedDaysWithTime.map(day => {
        const dayNumber = dayMapping[day.day];
        if (dayNumber === undefined) {
          console.error(`Неверное имя дня: ${day.day}`);
          throw new Error(`Неверное имя дня: ${day.day}`);
        }

        return axios.post("http://localhost:5000/api/teacher_types/days", {
          teacher_type_id: Number(teacherTypeId),
          day: dayNumber,
          time: day.time,
          is_active: true
        }).catch(err => {
          console.error(`Ошибка добавления дня ${day.day}:`, err);
          throw err;
        });
      })
    );

    toast.success("Расписание успешно сохранено!");

    // 3. Обновляем данные
    const updated = await axios.get(`http://localhost:5000/api/teacher_types/${selectedTeacherId}`);
    setTeacherAssignments(updated.data);
    updateBusyTimes(updated.data);

    // 4. Сбрасываем форму
    setSelectedDirectionId("");
    setSelectedLevel("");
    setDays(days.map(day => ({ ...day, selected: false, time: "" })));

  } catch (error) {
    console.error("Ошибка сохранения:", error);

    let errorMessage = "Ошибка при сохранении данных";
    if (error.response) {
      if (error.response.status === 400) {
        errorMessage = "Некорректные данные: " +
          (error.response.data.error || "проверьте введенные значения");
      } else if (error.response.status === 404) {
        errorMessage = "Ресурс не найден";
      }
    }

    toast.error(errorMessage);
  }
};


  // Утверждение заявки
  const approveRequest = async (requestId, isAdditionRequest) => {
    try {
      const id = Number(requestId);
      if (isNaN(id)) {
        throw new Error("Invalid request ID");
      }

      if (isAdditionRequest) {
        // Утверждение заявки на добавление
        await axios.put(`http://localhost:5000/api/teacher_types/approve/${id}`, {
          is_active: true
        });
      } else {
        // Утверждение заявки на удаление - фактическое удаление
        await axios.delete(`http://localhost:5000/api/teacher_types/${id}/confirm_deletion`);
      }
      
      toast.success("Заявка утверждена");
      
      // Обновление данных
      const [addRequests, deleteRequests] = await Promise.all([
        axios.get("http://localhost:5000/api/teacher_types/pending"),
        axios.get("http://localhost:5000/api/teacher_types/deletion_requests")
      ]);
      
      setPendingAddRequests(addRequests.data);
      setPendingDeleteRequests(deleteRequests.data);
      
      // Обновление назначений преподавателя, если он выбран
      if (selectedTeacherId) {
        const updatedAssignments = await axios.get(
          `http://localhost:5000/api/teacher_types/${selectedTeacherId}`
        );
        setTeacherAssignments(updatedAssignments.data);
      }
    } catch (error) {
      console.error("Ошибка при утверждении заявки:", error);
      toast.error(
        error.response?.data?.error || error.message || "Не удалось утвердить заявку"
      );
    }
  };

  // Отклонение заявки
  const rejectRequest = async (requestId, isAdditionRequest) => {
    if (window.confirm("Вы уверены, что хотите отклонить эту заявку?")) {
      try {
        if (isAdditionRequest) {
          // Для заявок на добавление - удаление
          await axios.delete(`http://localhost:5000/api/teacher_types/${requestId}`);
        } else {
          // Для заявок на удаление - восстановление
          await axios.put(`http://localhost:5000/api/teacher_types/${requestId}/reject_deletion`);
        }
        
        toast.success("Заявка отклонена");
        
        // Обновление данных
        const [addRequests, deleteRequests] = await Promise.all([
          axios.get("http://localhost:5000/api/teacher_types/pending"),
          axios.get("http://localhost:5000/api/teacher_types/deletion_requests")
        ]);
        
        setPendingAddRequests(addRequests.data);
        setPendingDeleteRequests(deleteRequests.data);
      } catch (error) {
        console.error("Ошибка при отклонении заявки:", error);
        toast.error("Не удалось отклонить заявку");
      }
    }
  };

  return (
    <div className="dance-admin-container">
      {}
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          Управление расписанием
        </button>
        <button 
          className={`tab-btn ${activeTab === 'addRequests' ? 'active' : ''}`}
          onClick={() => setActiveTab('addRequests')}
        >
          Заявки на добавление ({pendingAddRequests.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'deleteRequests' ? 'active' : ''}`}
          onClick={() => setActiveTab('deleteRequests')}
        >
          Заявки на удаление ({pendingDeleteRequests.length})
        </button>
      </div>

      {activeTab === 'schedule' ? (
        <>
          <form onSubmit={handleSubmit} className="dance-form">
            
            <div className="form-section">
              <label className="dance-label">Выберите учителя:</label>
              <select 
                value={selectedTeacherId} 
                onChange={handleTeacherChange}
                className="dance-select"
              >
                <option value="">-- Выберите --</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} {teacher.last_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedTeacherInfo && (
              <div className="teacher-info glow-box">
                <h3 className="gradient-text">Информация о преподавателе</h3>
                <p><strong>Email:</strong> {selectedTeacherInfo.email}</p>
                <p><strong>Опыт:</strong> {selectedTeacherInfo.experience}</p>
              </div>
            )}

           {teacherAssignments && teacherAssignments.length > 0 && (
  <div className="assignments-table glow-box">
    <h3 className="gradient-text">Текущие занятия преподавателя</h3>
    <table className="dance-table">
      <thead>
        <tr>
          <th>Направление</th>
          <th>Уровень</th>
          <th>Дни и время</th>
          <th>Статус</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        {teacherAssignments.map((assignment) => (
          <tr key={assignment.teacher_type_id}>
            <td>{assignment.direction_name}</td>
            <td>{assignment.level}</td>
            <td>
              {assignment.schedule && assignment.schedule.map((day, i) => (
                <div key={i}>
                  {["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"][day.day]} – {day.time}
                </div>
              ))}
            </td>
            <td>
              {assignment.is_active ? (
                <span className="status-approved">Утверждено</span>
              ) : (
                <span className="status-pending">На рассмотрении</span>
              )}
            </td>
            <td>
              <button
                type="button"
                className="dance-btn delete-btn"
                onClick={() => handleDeleteAssignment(assignment.id)}
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

            {}
            <div className="form-row">
              <div className="form-section">
                <label className="dance-label">Выберите направление:</label>
                <select
                  value={selectedDirectionId}
                  onChange={(e) => setSelectedDirectionId(e.target.value)}
                  className="dance-select"
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

            {}
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
              Сохранить расписание
            </button>
          </form>

          {}
          <div className="day-schedule-section glow-box">
            <h3 className="gradient-text">Расписание на день</h3>
            <div className="day-selector">
              {["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"].map((day, index) => (
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
        </>
      ) : activeTab === 'addRequests' ? (
        // Вкладка заявок на добавление
        <div className="requests-container glow-box">
          <h3 className="gradient-text">Заявки на добавление направлений</h3>
          {pendingAddRequests.length === 0 ? (
            <p>Нет заявок на рассмотрении</p>
          ) : (
            <table className="dance-table">
              <thead>
                <tr>
                  <th>Преподаватель</th>
                  <th>Направление</th>
                  <th>Уровень</th>
                  <th>Дни и время</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {pendingAddRequests.map((request) => (
                  <tr key={request.teacher_type_id}>
                    <td>{request.teacher_name} {request.teacher_last_name}</td>
                    <td>{request.direction_name}</td>
                    <td>{request.level}</td>
                    <td>
                      {request.schedule.map((day, i) => (
                        <div key={i}>
                          {["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"][day.day]} – {day.time}
                        </div>
                      ))}
                    </td>
                    <td>
                      <button
                        className="dance-btn approve-btn"
                        onClick={() => approveRequest(request.teacher_type_id, true)}
                      >
                        Утвердить
                      </button>
                      <button
                        className="dance-btn delete-btn"
                        onClick={() => rejectRequest(request.teacher_type_id, true)}
                      >
                        Отклонить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        // Вкладка заявок на удаление
        <div className="requests-container glow-box">
          <h3 className="gradient-text">Заявки на удаление направлений</h3>
          {pendingDeleteRequests.length === 0 ? (
            <p>Нет заявок на рассмотрении</p>
          ) : (
            <table className="dance-table">
              <thead>
                <tr>
                  <th>Преподаватель</th>
                  <th>Направление</th>
                  <th>Уровень</th>
                  <th>Дни и время</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {pendingDeleteRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.teacher_name} {request.teacher_last_name}</td>
                    <td>{request.direction_name}</td>
                    <td>{request.level}</td>
                    <td>
                      {request.schedule.map((day, i) => (
                        <div key={i}>
                          {["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"][day.day]} – {day.time}
                        </div>
                      ))}
                    </td>
                    <td>
                      <button
                        className="dance-btn approve-btn"
                        onClick={() => approveRequest(request.id, false)}
                      >
                        Удалить
                      </button>
                      <button
                        className="dance-btn delete-btn"
                        onClick={() => rejectRequest(request.id, false)}
                      >
                        Восстановить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Teacher_Types;