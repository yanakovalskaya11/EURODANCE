import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './quest.css'
import {
  Table,
  Button,
  Modal,
  message,
  Space,
  Tag,
  Card,
  Divider,
  Spin,
} from 'antd';
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import Header from '../header/Header';

const { confirm } = Modal;

const QuestionsManager = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [allAnswers, setAllAnswers] = useState([]);
  const [loading, setLoading] = useState({ questions: false, answers: false, allAnswers: false });
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const fetchQuestions = async () => {
    setLoading((prev) => ({ ...prev, questions: true }));
    try {
      const { data } = await axios.get('http://localhost:5000/api/questions/all');
      setQuestions(data);
    } catch (error) {
      console.error('Ошибка загрузки вопросов:', error);
      message.error('Ошибка при загрузке вопросов');
    } finally {
      setLoading((prev) => ({ ...prev, questions: false }));
    }
  };
  const fetchAnswersForQuestion = async (questionId) => {
    if (!questionId) return;
    setLoading((prev) => ({ ...prev, answers: true }));
    try {
      const { data } = await axios.get(`http://localhost:5000/api/questions/${questionId}/answers`);
      setAnswers(data.answers || []);
    } catch (error) {
      console.error('Ошибка загрузки ответов:', error);
      message.error('Ошибка при загрузке ответов');
    } finally {
      setLoading((prev) => ({ ...prev, answers: false }));
    }
  };
  const fetchAllAnswers = async () => {
    setLoading((prev) => ({ ...prev, allAnswers: true }));
    try {
      const { data } = await axios.get('http://localhost:5000/api/answers/all');
      setAllAnswers(data);
    } catch (error) {
      console.error('Ошибка загрузки всех ответов:', error);
      message.error('Ошибка при загрузке всех ответов');
    } finally {
      setLoading((prev) => ({ ...prev, allAnswers: false }));
    }
  };
  const handleDeleteQuestion = async (questionId) => {
    setLoading((prev) => ({ ...prev, questions: true }));
    try {
      const { data } = await axios.delete(`http://localhost:5000/api/admin/questions/${questionId}`);

      if (data.error) {
        message.error(data.error);
      } else {
        message.success(data.message || 'Вопрос удален');
        fetchQuestions();
      }
    } catch (error) {
      console.error('Ошибка удаления вопроса:', error);
      message.error(
        error.response?.data?.error ||
        error.response?.data?.details ||
        'Ошибка при удалении вопроса'
      );
    } finally {
      setLoading((prev) => ({ ...prev, questions: false }));
    }
  };
 const handleDeleteAnswer = async (answerId) => {
  try {
    const { data } = await axios.delete(`http://localhost:5000/api/admin/answers/${answerId}`);
    if (data.error) {
      message.error(data.error);
    } else {
      message.success(data.message || 'Ответ удалён');
      fetchAllAnswers(); // обновить список
    }
  } catch (error) {
    console.error('Ошибка удаления ответа:', error);
    message.error(
      error.response?.data?.error ||
      error.response?.data?.details ||
      'Ошибка при удалении ответа'
    );
  }
};
  const showDeleteConfirmQuestion = (question) => {
    
        handleDeleteQuestion(question.id);  };
  const showDeleteConfirmAnswer = (answer) => {
        handleDeleteAnswer(answer.id);
  };
  const showQuestionDetails = async (question) => {
    setSelectedQuestion(question);
    setModalVisible(true);
    await fetchAnswersForQuestion(question.id);
  };
  useEffect(() => {
    fetchQuestions();
    fetchAllAnswers();
  }, []);

  const questionColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Вопрос',
      dataIndex: 'question',
      render: (text) => text?.length > 50 ? `${text.slice(0, 50)}...` : text,
    },
    {
      title: 'Тип',
      dataIndex: 'type_id',
      render: (typeId) => typeId || 'Не указан',
    },
    {
      title: 'Статус',
      render: (_, record) => (
        <Space>
          {record.is_anonym && <Tag color="orange">Анонимно</Tag>}
          {record.is_deleted ? (
            <Tag color="red">Удален</Tag>
          ) : (
            <Tag color="green">Активен</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Дата',
      dataIndex: 'created_at',
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Действия',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EyeOutlined />} onClick={() => showQuestionDetails(record)} />
          <Button
            icon={<DeleteOutlined />}
            danger
            disabled={record.is_deleted}
            onClick={() => showDeleteConfirmQuestion(record)}
          />
        </Space>
      ),
    },
  ];

  const answerColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: 'Ответ',
      dataIndex: 'answer',
      render: (text) => text || '—',
    },
    {
      title: 'Преподаватель',
      render: (_, record) => (
        record.teacher_name && record.teacher_surname
          ? `${record.teacher_name} ${record.teacher_surname}`
          : `ID: ${record.id_teacher}`
      ),
    },
    {
      title: 'Дата',
      dataIndex: 'created_at',
      render: (date) => new Date(date).toLocaleString(),
    },
  ];

  const allAnswerColumns = [
    ...answerColumns,
    {
      title: 'Действия',
      width: 100,
      render: (_, record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => showDeleteConfirmAnswer(record)}
        />
      ),
    },
  ];

  return (
    <div className="questions-manager" style={{ padding: 24 }}>
        <Header/>
      <Card
        title="Управление вопросами"
        extra={
          <Button
            type="primary"
            onClick={fetchQuestions}
            loading={loading.questions}
            icon={<EyeOutlined />}
          >
            Обновить список
          </Button>
        }
      >
        <Spin spinning={loading.questions}>
          <Table
            columns={questionColumns}
            dataSource={questions}
            rowKey="id"
            scroll={{ x: true }}
            locale={{
              emptyText: loading.questions ? 'Загрузка...' : 'Нет вопросов для отображения',
            }}
          />
        </Spin>
      </Card>

      <Modal
        title={`Вопрос #${selectedQuestion?.id}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {selectedQuestion && (
          <>
            <div style={{ marginBottom: 20 }}>
              <h3>Текст вопроса:</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{selectedQuestion.question}</p>
              <Divider />
              <Space wrap>
                <Tag>
                  <strong>Тип:</strong> {selectedQuestion.type_id || 'Не указан'}
                </Tag>
                <Tag>
                  <strong>Дата:</strong> {new Date(selectedQuestion.created_at).toLocaleString()}
                </Tag>
                {selectedQuestion.is_anonym && <Tag color="orange">Анонимный вопрос</Tag>}
                {selectedQuestion.is_read_by_teacher && <Tag color="blue">Прочитан преподавателем</Tag>}
              </Space>
            </div>

            <h3>Ответы:</h3>
            {loading.answers ? (
              <Spin tip="Загрузка ответов..." />
            ) : answers.length > 0 ? (
              <Table
                columns={answerColumns}
                dataSource={answers}
                rowKey="id"
                pagination={false}
                size="small"
                bordered
              />
            ) : (
              <p>Нет ответов на этот вопрос</p>
            )}
          </>
        )}
      </Modal>

      <Card
        title="Все ответы"
        style={{ marginTop: 24 }}
        extra={
          <Button
            type="primary"
            onClick={fetchAllAnswers}
            loading={loading.allAnswers}
            icon={<EyeOutlined />}
          >
            Обновить ответы
          </Button>
        }
      >
        <Spin spinning={loading.allAnswers}>
          <Table
            columns={allAnswerColumns}
            dataSource={allAnswers}
            rowKey="id"
            scroll={{ x: true }}
            locale={{
              emptyText: loading.allAnswers ? 'Загрузка...' : 'Нет ответов для отображения',
            }}
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default QuestionsManager;
