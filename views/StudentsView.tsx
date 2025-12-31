
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../components/common/Modal';
import WebcamCaptureModal from '../components/common/WebcamCaptureModal';
import type { Student, NewStudent, NewCommunicationLog, NewTransaction, SchoolClass, CommunicationLog, FeeItem } from '../types';
import { CommunicationType, StudentStatus, TransactionType } from '../types';
import StudentBillingModal from '../components/common/StudentBillingModal';
import BulkMessageModal from '../components/common/BulkMessageModal';
import PromotionModal from '../components/common/PromotionModal';
import { useData } from '../contexts/DataContext';
import ImportModal from '../components/common/ImportModal';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import * as api from '../services/api';
import { calculateAge } from '../utils/helpers';

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
    const [loadingLogs, setLoadingLogs] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && student) {
            setActiveTab('details');
            setMessage('');
            setFormData({ ...student });
            
            setLoadingLogs(true);
            api.getCommunicationLogs({ studentId: student.id, limit: 20 })
                .then(res => setStudentLogs(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoadingLogs(false));
        }
    }, [isOpen, student]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const formData = new FormData();
            formData.append('file', e.target.files[0]);
            try {
                const res = await api.uploadStudentPhoto(formData);
                setFormData(prev => ({ ...prev, profileImage: res.url }));
                addNotification('Photo uploaded successfully', 'success');
            } catch (error) {
                addNotification('Failed to upload photo', 'error');
            }
        }
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student) return;
        try {
            const { id, admissionNumber, class: className, balance, ...updates } = formData as any;
            await api.updateStudent(student.id, updates);
            addNotification(`${student.name}'s profile updated successfully.`, 'success');
            onClose();
        } catch (error) {
            addNotification('Failed to update student.', 'error');
        }
    };

    const