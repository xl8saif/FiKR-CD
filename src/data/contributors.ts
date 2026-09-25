import {
  PROJECT_DIRECTOR_LINKEDIN,
  PROJECT_DIRECTOR_FACEBOOK,
  PROJECT_DIRECTOR_WHATSAPP
} from '../services/speechAiService';

export interface ContributorSocialLinks {
  linkedin?: string;
  facebook?: string;
  whatsapp?: string;
  email?: string;
}

export interface Contributor {
  name: string;
  role: string;
  photo?: string;
  social: ContributorSocialLinks;
}

export const CONTRIBUTORS: Contributor[] = [
  {
    name: 'Saif Ullah',
    role: 'Project Director · Co-founder · Researcher · Linguist · Translator · Language Technology & Localization Specialist',
    social: {
      linkedin: PROJECT_DIRECTOR_LINKEDIN,
      facebook: PROJECT_DIRECTOR_FACEBOOK,
      whatsapp: PROJECT_DIRECTOR_WHATSAPP,
      email: undefined
    }
  },
  {
    name: 'Dr. Hussain Ahmad Faizy',
    role: 'Co-founder of FiKR&CD · Book Author · Researcher · Linguist · Contributor',
    social: {}
  },
  {
    name: 'Mujeeb ul Haq Jailani',
    role: 'Native speaker · Researcher · Linguist · Contributor',
    social: {}
  },
  {
    name: 'Rasheed Ahmad Faizy',
    role: 'Native speaker · Researcher · Linguist · Contributor',
    social: {}
  },
  {
    name: 'Muhammad Iqbal Abasindi',
    role: 'Native speaker · Researcher · Linguist · Contributor',
    social: {}
  },
  {
    name: 'Ihsan Ullah',
    role: 'Native speaker · Researcher · Contributor',
    social: {}
  },
  {
    name: 'Abdul Hadi',
    role: 'Native speaker · Researcher · Contributor',
    social: {}
  },
  {
    name: 'Aslam Dani',
    role: 'Native speaker · Researcher · Contributor',
    social: {}
  },
  {
    name: 'Atta Ur Rehman Aziz',
    role: 'Native speaker · Researcher · Linguist · Contributor',
    social: {}
  },
  {
    name: 'Jameel Ahmad Umang',
    role: 'Native speaker · Researcher · Linguist · Contributor',
    social: {}
  },
  {
    name: 'Ahsanullah Majid',
    role: 'Native speaker · Researcher · Linguist · Contributor',
    social: {}
  },
  {
    name: 'Hasan Jamil',
    role: 'Native speaker · Researcher · Linguist · Contributor',
    social: {}
  },
  {
    name: 'FiKR&CD Admin Team',
    role: 'Administrator',
    social: {}
  }
];
