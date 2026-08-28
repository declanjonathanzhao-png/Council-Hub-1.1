import { CouncilDocument, Department, CouncilTask, CouncilEvent } from '../types';
import councilLogo from '../assets/images/student_council_logo_1787794641574.jpg';
import houseLogo from '../assets/images/house_department_logo_1787802456404.jpg';
import prefectLogo from '../assets/images/prefectorial_board_logo_1787802473729.jpg';
import welfareLogo from '../assets/images/student_welfare_logo_1787802487046.jpg';
import viaLogo from '../assets/images/via_board_logo_1787802501138.jpg';
import mediaLogo from '../assets/images/media_leaders_logo_1787802516539.jpg';
import techLogo from '../assets/images/student_tech_logo_1787802532841.jpg';

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-exec',
    name: 'Executive Committee',
    slug: 'executive-committee',
    iconName: 'stars',
    memberCount: 15,
    activeFileCount: 24,
    folders: [],
    badgeImage: councilLogo,
  },
  {
    id: 'dept-house',
    name: 'House Department',
    slug: 'house-department',
    iconName: 'domain',
    memberCount: 22,
    activeFileCount: 18,
    folders: [],
    badgeImage: houseLogo,
  },
  {
    id: 'dept-prefect',
    name: 'Prefectorial Board',
    slug: 'prefectorial-board',
    iconName: 'shield',
    memberCount: 28,
    activeFileCount: 31,
    folders: [],
    badgeImage: prefectLogo,
  },
  {
    id: 'dept-welfare',
    name: 'Student Welfare Board',
    slug: 'student-welfare-board',
    iconName: 'favorite',
    memberCount: 19,
    activeFileCount: 14,
    folders: [],
    badgeImage: welfareLogo,
  },
  {
    id: 'dept-via',
    name: 'Values in Action Board',
    slug: 'values-in-action-board',
    iconName: 'handshake',
    memberCount: 16,
    activeFileCount: 12,
    folders: [],
    badgeImage: viaLogo,
  },
  {
    id: 'dept-media',
    name: 'Media and Communication Leaders',
    slug: 'media-and-communication-leaders',
    iconName: 'campaign',
    memberCount: 14,
    activeFileCount: 26,
    folders: [],
    badgeImage: mediaLogo,
  },
  {
    id: 'dept-tech',
    name: 'Student Tech Leaders',
    slug: 'student-tech-leaders',
    iconName: 'computer',
    memberCount: 12,
    activeFileCount: 17,
    folders: [],
    badgeImage: techLogo,
  },
];

export const INITIAL_DOCUMENTS: CouncilDocument[] = [];

export const INITIAL_TASKS: CouncilTask[] = [];

export const INITIAL_EVENTS: CouncilEvent[] = [];

