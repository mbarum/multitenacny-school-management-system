import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../common/Modal';
import WebcamCaptureModal from '../common/WebcamCaptureModal';
import type { Student, NewStudent, NewCommunicationLog, NewTransaction, SchoolClass, CommunicationLog } from '../../types';
import { CommunicationType, StudentStatus, TransactionType } from '../../types';
import StudentBillingModal from '../common/StudentBillingModal';
import BulkMessageModal from '../common/BulkMessageModal';
import PromotionModal from '../common/PromotionModal';
import { useData } from '../../contexts/DataContext';
import ImportModal from '../common/ImportModal';
import Pagination from '../common/Pagination';
import Skeleton from '../common/Skeleton';
import * as api from '../../services/api';
import { calculateAge } from '../../utils/helpers';

const DEFAULT_AVATAR = 'https://i.imgur.com/S5o7W44.png';

// --- Sub-components ---

interface StudentProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    onViewIdCard: () => void;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ isOpen, onClose, student, onViewIdCard }) => {
    const { currentUser, addNotification } = useData();
    const [activeTab, setActiveTab] = useState<'details' | 'communication'>('details');
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState<Partial<Student>>({});
    
    const [studentLogs, setStudentLogs] = useState<CommunicationLog[]>([]);
    const [loadingLogs,