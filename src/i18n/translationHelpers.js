import i18n from './i18n';

export const getTranslatedDefaultRoles = () => {
  return [
    {
      id: '1',
      name: i18n.t('defaultRoles.owner'),
      permissions: ['all', 'manage_employees', 'manage_roles', 'manage_schedule', 'manage_shifts', 'analytics']
    },
    {
      id: '2',
      name: i18n.t('defaultRoles.manager'),
      permissions: ['manage_schedule']
    },
    {
      id: '3',
      name: i18n.t('defaultRoles.employee'),
      permissions: []
    }
  ];
};

export const getTranslatedDefaultShiftPresets = () => {
  return [
    { id: '1', name: i18n.t('defaultShiftPresets.morningShift'), hours: 5 },
    { id: '2', name: i18n.t('defaultShiftPresets.afternoonShift'), hours: 5 },
    { id: '3', name: i18n.t('defaultShiftPresets.fullDay'), hours: 7 }
  ];
};
