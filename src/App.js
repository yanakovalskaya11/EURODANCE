import React, { useContext, useEffect, useState } from 'react';
import { UserContext, UserProvider } from './UserContext';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import axios from 'axios';
import Header from './Parth/header/Header';
import Registr from './Parth/registration/Registr';
import Naprav from './Parth/Napravlenie/Naprav';
import Log_in from './Parth/log_in/log_in';
import Personal from './Parth/Personal/Personal';
import Footer from './Parth/Footer/Footer';
import Admin from './Parth/Admin/Admin'
import Napravleniya from './Parth/Napravleniya/Napravleniya'
import ShowTickets from './Parth/Tickets/ShowTickets';
import ShowTeachers from './Parth/teachers/ShowTeachers';
import Teacher from './Parth/Teacher/Teacher';
import ShowTicket from'./Parth/Ticket/ShowTicket'
import ShowNews from './Parth/News/ShowNews';
import Main_header from './Parth/header/main_header';
import ShowTeacher from './Parth/Teacher/ShowTeacher';
import About_us from './Parth/About_us/About_us';
import Show_stocks from './Parth/About_us/Show_stocks';
import TimeTable from './Parth/Timetable/TimeTable';
import SurveyForm from './Parth/Survey/SurveyForm';
import BranchMap from './Parth/BranchMap';
import DanceGallery from './Parth/header/DanceMenu';
import Teacher_advice from './Parth/Other/Teacher_advice';
import Teacher_videos from './Parth/Teacher_videos/Teacher_videos';
import './index.css'
import SpendScores from './Parth/scores/SpendScores';
import ScrollButton from './Parth/ScrollButton';
import ScrollToTop from './hooks/ScrollTop';
import StartNowWith from './Parth/About_us/StartNowWith';
import TeacherRating from './Parth/About_us/TeacherRating';
import Payment from './hooks/Payment'
import PaymentSuccess from './hooks/PaymentSuccess';
import Comment from './Parth/About_us/Comments'
import Students_questions from './Parth/Other/Students_questions';
import QuestionDetail from './Parth/Other/QuestionDetail';
import CommentsSlider from './Parth/About_us/CommentsSlide';
import ForgotPassword from './Parth/log_in/ForgotPassword';
import PrivacyPolicy from './Parth/About_us/PrivacyPolitick';
import Terms from './Parth/About_us/Terms';
import AboutStudio from './Parth/About_us/AboutStudio';
import { ToastContainer } from 'react-toastify';

const App = () => {
  const [data, setData] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('http://localhost:5000/api/check-auth', {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setCurrentUser(data.user);
      })
      .catch(() => {
        setCurrentUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка...</div>;


  function Login(){
    return(
    <Log_in/>
    
    )
  }

function Main(){
  
  return(
    <>
  <Header/>
  <div>
  <DanceGallery/>
  <About_us/>
  <Show_stocks/>
  <StartNowWith/>


  <TeacherRating/>
    <CommentsSlider/>

    <ShowNews/> 

  <TimeTable/>

    <BranchMap/>
  {/* <Show_stocks/>


  <Napravleniya/>
  
  <ShowTeachers/>
  <ShowNews/>
  <TimeTable/>
  <BranchMap/>
  <ScrollButton/> */}
  <ScrollButton/>
  </div>
  <Footer/>
  </>
  )
 
}
function Reg(){
  return(
  <>
    <Header/>
      <div className="main-content">
    <Registr/>
    </div>
    </>
  )
}
function Administrator(){
  return(
    <>
    <Header/>
    <div className='main-content'>
    <Admin/>
    <ScrollButton/>
    </div>
  </>
  )
}

function Personality(){
  return(<>
    <Personal/>
    <ScrollButton/>
    </>
  )
}

function About(){
  return(
    <>
    <Header/>
    <div className="main-content">
    <About_us/>
    <Comment/>
    <ScrollButton/>
    <Footer/>
    </div>
    </>
  )
}
function Naprav_(){
  return(
    <>
    <Header/>
    <div className="main-content">
    <Napravleniya/>
    <ScrollButton/>
    <Footer/>
    </div>
    </>
  )
}
function NapravList(){
  return(
    <>
    <Outlet/>
    <ScrollButton/>
    </>
  )
}
function Tickets_List(){
  return(
    <>
    <Outlet/>
    <ScrollButton/>
    </>
  )
}
function Teacher_List(){
  return(
    <>
    <Outlet/>
    <ScrollButton/>
    </>
  )
}
function Teachers(){
  return(
  <>
  <Header/>
  <div className="main-content">
  <ShowTeachers/>
  <ScrollButton/>
  <Footer/>
  </div>
  </>
  )
}
function Tickets(){
  return(
  <>
  <Header/>
  <div className="main-content">
  <ShowTickets/>
  <ScrollButton/>
  <Footer/>
  </div>
  </>
  )
}


function Teacher_(){
return(
  <>
  <Header/>
  <div className="main-content">
  <Teacher/>
  <ScrollButton/>
  <Footer/>
  </div>
  </>
  )
}
function Time(){
  return(
    <>
    <Header/>
    <div className="main-content">
    <TimeTable/>
    <ScrollButton/>
    <Footer/>
    </div>
    </>
    )
  }

  return (
    <>      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored" // или "light", "dark"
      />
    <UserProvider value={{ currentUser, setCurrentUser }}>
        <Router>
          <ScrollToTop/>
      <Routes>
        <Route path='/' element={<Main/>}/>
        <Route path="/login" element={<Login />} />
        <Route path="/reg" element={<Reg />} />
        <Route path='/admin' element={<Administrator/>}/>
        <Route path='/personal' element={<Personality/>}/>
        <Route path='/timetable' element={<Time/>}/>
        <Route path='/teachers' element={<Teacher_List/>}>
        <Route index element={<Teachers/>}></Route>
        <Route path=':id' element={<ShowTeacher/>}></Route>
        </Route>
        <Route path="/survey/:reservId" element={<SurveyForm />} />
        <Route path='/teacher' element={<Teacher_/>}/>
        {/* <Route path='/napravleniya' element={<Naprav/>}/> */}

        <Route path='/tickets' element={<Tickets_List/>}>
          <Route index element={<Tickets/>}/>
          <Route path=':id' element={<ShowTicket/>}/>
        </Route>

        <Route path='/about' element={<About/>}/>
        <Route path='/about_studio' element={<AboutStudio/>}/>


        <Route path='/teacher-advices' element={<Teacher_advice/>}/>
        <Route path='/teacher-videos' element={<Teacher_videos/>}/>
        <Route path='/scores' element={<SpendScores/>}/>
        <Route path="/privacy-policy" element={<PrivacyPolicy/>} />

        <Route path="/terms" element={<Terms/>} />
        <Route path='/questions' element={<Students_questions/>}></Route>
        <Route path='/napravleniya' element={<NapravList/>}>
          <Route index element={<Naprav_/>}/>
          <Route path=':id' element={<Naprav/>}/>
        </Route>
        <Route path="/payment" element={<Payment/>} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/question/:id" element={<QuestionDetail />} />
        
        <Route path="/forgot-password" element={<ForgotPassword />} />

      </Routes>
    </Router>
    </UserProvider>
 </>

  );

};

export default App;
