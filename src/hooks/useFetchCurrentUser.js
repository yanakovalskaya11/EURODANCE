import { useCallback } from 'react';
import axios from 'axios';

const useFetchCurrentUser = (currentUser, setCurrentUser) => {
  return useCallback(async () => {
    if (!currentUser?.id) return null;

    try {
      const { data } = await axios.get(`http://localhost:5000/api/users/${currentUser.id}`, {
        withCredentials: true,
      });

      if (JSON.stringify(data) !== JSON.stringify(currentUser)) {
        setCurrentUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      }

      return data;
    } catch (error) {
      console.error('Ошибка получения пользователя:', error);
      return null;
    }
  }, [currentUser, setCurrentUser]);
};

export default useFetchCurrentUser;
