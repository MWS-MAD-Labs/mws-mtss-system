import React, { createContext, useContext, useState, useEffect } from 'react';

const JobContext = createContext();

export const useJobs = () => {
    const context = useContext(JobContext);
    if (!context) {
        throw new Error('useJobs must be used within a JobProvider');
    }
    return context;
};

export const JobProvider = ({ children }) => {
    const [jobs, setJobs] = useState([]);
    const [activeJobs, setActiveJobs] = useState([]);

    useEffect(() => {
        // Load jobs from localStorage
        const savedJobs = localStorage.getItem('kerjain_jobs');
        if (savedJobs) {
            const parsedJobs = JSON.parse(savedJobs);
            setJobs(parsedJobs);
            setActiveJobs(parsedJobs.filter(job => ['pending', 'accepted', 'in_progress'].includes(job.status)));
        }
    }, []);

    const saveJobs = (updatedJobs) => {
        setJobs(updatedJobs);
        localStorage.setItem('kerjain_jobs', JSON.stringify(updatedJobs));
        setActiveJobs(updatedJobs.filter(job => ['pending', 'accepted', 'in_progress'].includes(job.status)));
    };

    const createJob = (jobData) => {
        const newJob = {
            id: Date.now().toString(),
            ...jobData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            applications: []
        };
        const updatedJobs = [...jobs, newJob];
        saveJobs(updatedJobs);
        return newJob;
    };

    const updateJob = (jobId, updates) => {
        const updatedJobs = jobs.map(job =>
            job.id === jobId ? { ...job, ...updates } : job
        );
        saveJobs(updatedJobs);
    };

    const getJobById = (jobId) => {
        return jobs.find(job => job.id === jobId);
    };

    const value = {
        jobs,
        activeJobs,
        createJob,
        updateJob,
        getJobById
    };

    return (
        <JobContext.Provider value={value}>
            {children}
        </JobContext.Provider>
    );
};