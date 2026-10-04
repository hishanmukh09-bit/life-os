export interface ParsedTaskResult {
  title: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  reminderOption: 'NONE' | 'AT_TIME' | '5_MIN' | '10_MIN' | '15_MIN' | '30_MIN' | '1_HOUR' | '1_DAY';
  category: 'Study' | 'College' | 'Work' | 'Fitness' | 'Health' | 'Personal' | 'Household' | 'Life Admin' | 'Other';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'MUST_DO';
  interpretedText: string;
}

export function parseNaturalLanguageTask(input: string): ParsedTaskResult {
  let cleaned = input.trim();
  const lower = cleaned.toLowerCase();

  // Detect category
  let category: ParsedTaskResult['category'] = 'Personal';
  if (/study|assignment|exam|dbms|daa|homework|read|chapter|syllabus|math|algorithm/i.test(lower)) {
    category = 'Study';
  } else if (/workout|gym|exercise|run|walk|hiit|fitness|stretch|cardio/i.test(lower)) {
    category = 'Fitness';
  } else if (/doctor|medicine|health|dentist|sleep|water/i.test(lower)) {
    category = 'Health';
  } else if (/bill|pay|bank|renew|document|clean|room|grocery|shopping/i.test(lower)) {
    category = 'Life Admin';
  } else if (/project|code|repo|build|client|work/i.test(lower)) {
    category = 'Work';
  }

  // Detect priority
  let priority: ParsedTaskResult['priority'] = 'NORMAL';
  if (/urgent|asap|must do|critical|important/i.test(lower)) {
    priority = 'MUST_DO';
    cleaned = cleaned.replace(/urgent|asap|must do|critical|important/gi, '').trim();
  } else if (/high priority|high/i.test(lower)) {
    priority = 'HIGH';
    cleaned = cleaned.replace(/high priority/gi, '').trim();
  }

  // Calculate Date
  const now = new Date();
  let targetDate = new Date();
  let dateDescription = 'Today';

  if (/\btomorrow\b/i.test(lower)) {
    targetDate.setDate(targetDate.getDate() + 1);
    dateDescription = 'Tomorrow';
    cleaned = cleaned.replace(/\btomorrow\b/gi, '').trim();
  } else if (/\bsaturday\b/i.test(lower)) {
    const diff = (6 - now.getDay() + 7) % 7 || 7;
    targetDate.setDate(targetDate.getDate() + diff);
    dateDescription = 'This Saturday';
    cleaned = cleaned.replace(/\b(on\s+)?saturday\b/gi, '').trim();
  } else if (/\bsunday\b/i.test(lower)) {
    const diff = (7 - now.getDay() + 7) % 7 || 7;
    targetDate.setDate(targetDate.getDate() + diff);
    dateDescription = 'This Sunday';
    cleaned = cleaned.replace(/\b(on\s+)?sunday\b/gi, '').trim();
  } else if (/\bnext week\b/i.test(lower)) {
    targetDate.setDate(targetDate.getDate() + 7);
    dateDescription = 'Next Week';
    cleaned = cleaned.replace(/\bnext week\b/gi, '').trim();
  }

  // Calculate Time
  let timeStr = '17:00';
  let timeDescription = '5:00 PM';
  const timeRegex = /\b(?:at|by)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
  const match = cleaned.match(timeRegex);

  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3].toLowerCase();

    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;

    timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    timeDescription = `${match[1]}:${minute.toString().padStart(2, '0')} ${ampm.toUpperCase()}`;
    cleaned = cleaned.replace(match[0], '').trim();
  } else if (/morning/i.test(lower)) {
    timeStr = '09:00';
    timeDescription = '9:00 AM';
    cleaned = cleaned.replace(/\b(in the\s+)?morning\b/gi, '').trim();
  } else if (/evening|night/i.test(lower)) {
    timeStr = '19:00';
    timeDescription = '7:00 PM';
    cleaned = cleaned.replace(/\b(in the\s+)?(evening|night)\b/gi, '').trim();
  } else if (/afternoon/i.test(lower)) {
    timeStr = '14:00';
    timeDescription = '2:00 PM';
    cleaned = cleaned.replace(/\b(in the\s+)?afternoon\b/gi, '').trim();
  }

  // Clean trailing prepositions
  cleaned = cleaned.replace(/\s+(at|by|on|for)$/i, '').trim();
  const title = cleaned || input.trim();

  // Smart reminder option: 15 minutes before by default for scheduled times
  let reminderOption: ParsedTaskResult['reminderOption'] = '15_MIN';
  if (/remind(er)?\s*(at\s*time|exact)/i.test(lower)) {
    reminderOption = 'AT_TIME';
  } else if (/remind(er)?\s*30\s*m/i.test(lower)) {
    reminderOption = '30_MIN';
  } else if (/remind(er)?\s*1\s*h/i.test(lower)) {
    reminderOption = '1_HOUR';
  }

  const dueDate = targetDate.toISOString().split('T')[0];

  return {
    title,
    dueDate,
    dueTime: timeStr,
    reminderOption,
    category,
    priority,
    interpretedText: `Scheduled for ${dateDescription} at ${timeDescription} (${reminderOption === '15_MIN' ? '15m before reminder' : 'Reminder scheduled'})`
  };
}
