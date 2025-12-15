
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TimetableEntry, SchoolClass, Subject, Staff } from '../types';
import { DayOfWeek } from '../types';
import Modal from '../components/common/Modal';
import { useData } from '../contexts/DataContext';
import