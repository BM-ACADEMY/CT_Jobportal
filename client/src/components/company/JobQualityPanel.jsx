import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Form, Progress, Alert } from 'antd';

const API_JOBS_URL = `${import.meta.env.VITE_API_BASE_URL}/jobs`;
const COLOR = { good: '#10b981', ok: '#f59e0b', weak: '#ef4444' };
const LABEL = { good: 'Good post', ok: 'Can be better', weak: 'Needs work' };

// Live quality score and tips for the job being typed. Advisory only: it never blocks publishing,
// and if the request fails the panel simply stays hidden.
const JobQualityPanel = ({ form, skills, isRangeHidden }) => {
  const values = Form.useWatch([], form);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!values) return undefined;
    const timer = setTimeout(() => {
      // The form takes salary in lakhs; the server scores rupees, like the saved job.
      const draft = {
        title: values.title,
        description: values.description,
        experience: { min: values.minExperience || 0, max: values.maxExperience || 0 },
        workMode: values.workMode,
        location: values.location,
        salary: {
          min: values.minSalary ? Number(values.minSalary) * 100000 : 0,
          max: values.maxSalary ? Number(values.maxSalary) * 100000 : 0,
          isRangeHidden,
        },
        skillsRequired: skills,
      };
      axios.post(`${API_JOBS_URL}/quality-check`, draft)
        .then((res) => setResult(res.data))
        .catch(() => setResult(null));
    }, 700);
    return () => clearTimeout(timer);
  }, [values, skills, isRangeHidden]);

  if (!result) return null;
  return (
    <Alert
      type={result.level === 'good' ? 'success' : result.level === 'ok' ? 'warning' : 'error'}
      showIcon={false}
      className="mb-6"
      message={(
        <div className="flex items-center gap-4">
          <Progress type="circle" size={52} percent={result.score} strokeColor={COLOR[result.level]} />
          <div>
            <div className="font-semibold">Post quality: {LABEL[result.level]}</div>
            <div className="text-xs text-slate-500">Better posts reach more of the right candidates. You can still publish at any score.</div>
          </div>
        </div>
      )}
      description={result.tips.length > 0 ? (
        <ul className="list-disc pl-5 mt-2 text-sm">
          {result.tips.map((t) => <li key={t.field}>{t.tip}</li>)}
        </ul>
      ) : null}
    />
  );
};

export default JobQualityPanel;
