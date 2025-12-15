
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SchoolEvent } from '../types';
import { EventCategory } from '../types';
import Modal from '../components/common/Modal';
import { useData } from '../contexts/DataContext';
import * as api from '../services/api';

const CalendarView: React.FC = () => {
    const { addNotification } = useData();
    const queryClient = useQueryClient();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);
    const [modalDate, setModalDate] = useState<Date | null>(null);

    const { data: events = [] } = useQuery({
        queryKey: ['events'],
        queryFn: () => api.getEvents(),
    });

    const updateEventsMutation = useMutation({
        mutationFn: (events: SchoolEvent[]) => api.updateEvents(events),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            setIsModalOpen(false);
            addNotification('Calendar updated', 'success');
        }
    });

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();

    const calendarDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < startDay; i++) {
            days.push({ key: `empty-${i}`, date: null, events: [] });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const dayEvents = events.filter((e: SchoolEvent) => {
                const startDate = new Date(e.startDate);
                const endDate = e.endDate ? new Date(e.endDate) : startDate;
                return date >= startDate && date <= endDate;
            });
            days.push({ key: i, date, events: dayEvents });
        }
        return days;
    }, [currentDate, events, startDay, daysInMonth]);

    const changeMonth = (delta: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const openModal = (event: SchoolEvent | null, date: Date | null) => {
        setSelectedEvent(event);
        setModalDate(date);
        setIsModalOpen(true);
    };

    const handleSaveEvent = (formData: Omit<SchoolEvent, 'id'>) => {
        let updatedEvents;
        if (selectedEvent) {
            updatedEvents = events.map((e: SchoolEvent) => e.id === selectedEvent.id ? { ...selectedEvent, ...formData } : e);
        } else {
            updatedEvents = [...events, { ...formData, id: `evt-${Date.now()}` }];
        }
        updateEventsMutation.mutate(updatedEvents);
    };

    const handleDeleteEvent = () => {
        if (selectedEvent && window.confirm("Are you sure you want to delete this event?")) {
            const remaining = events.filter((e: SchoolEvent) => e.id !== selectedEvent.id);
            updateEventsMutation.mutate(remaining);
        }
    }

    const categoryColors: Record<EventCategory, string> = {
        [EventCategory.Holiday]: 'bg-red-200 text-red-800',
        [EventCategory.Academic]: 'bg-blue-200 text-blue-800',
        [EventCategory.Meeting]: 'bg-yellow-200 text-yellow-800',
        [EventCategory.Sports]: 'bg-green-200 text-green-800',
        [EventCategory.General]: 'bg-slate-200 text-slate-800',
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-200 rounded">&larr;</button>
                    <h2 className="text-3xl font-bold text-slate-800">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-200 rounded">&rarr;</button>
                </div>
                <button onClick={() => openModal(null, new Date())} className="px-4 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700">Add Event</button>
            </div>
            <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="text-center font-bold bg-white py-3">{day}</div>)}
                {calendarDays.map((day, idx) => (
                    <div key={idx} className={`bg-white p-2 h-32 overflow-y-auto ${day.date ? 'hover:bg-slate-50 cursor-pointer' : ''}`} onClick={() => day.date && openModal(null, day.date)}>
                        {day.date && <div className="font-bold mb-1">{day.date.getDate()}</div>}
                        {day.events.map((event: SchoolEvent) => (
                            <div key={event.id} onClick={(e) => { e.stopPropagation(); openModal(event, null); }} className={`text-xs p-1 rounded mt-1 cursor-pointer truncate ${categoryColors[event.category]}`}>
                                {event.title}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            {isModalOpen && <EventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveEvent} onDelete={handleDeleteEvent} event={selectedEvent} date={modalDate} />}
        </div>
    );
};

const EventModal: React.FC<any> = ({ isOpen, onClose, onSave, onDelete, event, date }) => {
    const [formData, setFormData] = useState({
        title: event?.title || '',
        description: event?.description || '',
        startDate: event?.startDate || date?.toISOString().split('T')[0] || '',
        endDate: event?.endDate || '',
        category: event?.category || EventCategory.General,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={event ? "Edit Event" : "Add Event"}>
            <form onSubmit={e => { e.preventDefault(); onSave(formData); }} className="space-y-4">
                <input name="title" value={formData.title} onChange={handleChange} placeholder="Event Title" className="w-full p-2 border rounded" required />
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="w-full p-2 border rounded" />
                <div className="grid grid-cols-2 gap-4">
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full p-2 border rounded" required />
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full p-2 border rounded" />
                </div>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded">
                    {Object.values(EventCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <div className="flex justify-between">
                    {event && <button type="button" onClick={onDelete} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>}
                    <div className="flex-grow"></div>
                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Save Event</button>
                </div>
            </form>
        </Modal>
    )
};

export default CalendarView;
