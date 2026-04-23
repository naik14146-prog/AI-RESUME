import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    FaChevronLeft, FaMagic, FaDownload, FaUser, FaBriefcase, 
    FaGraduationCap, FaTools, FaQuoteLeft, FaLayerGroup 
} from 'react-icons/fa';
import ResumePreview from '../ResumePreview/ResumePreview';
import AIAssistant from './AIAssistant';
import TemplateSelector from './TemplateSelector';
import logo from '../../assets/logo.png';
import apiRequest, { resumeService } from '../../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './Editor.css';

const Editor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    React.useEffect(() => {
        if (id && id !== 'new') {
            const fetchResume = async () => {
                try {
                    const data = await resumeService.getById(id);
                    setResumeData(data);
                } catch (err) {
                    console.error('Failed to fetch resume:', err);
                }
            };
            fetchResume();
        }
    }, [id]);

    const [activeSection, setActiveSection] = useState('personal');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [resumeData, setResumeData] = useState({
        title: 'Software Engineer - Senior Role',
        templateId: location.state?.templateId || 'modern',
        personalInfo: {
            fullName: 'Alexander Pierce',
            jobTitle: 'Senior Software Architect',
            email: 'alex.pierce@example.com',
            phone: '+1 (555) 000-1111',
            location: 'San Francisco, CA',
            photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
        },
        summary: 'Strategic Software Architect with 10+ years of experience in distributed systems and cloud-native applications. Expert in React, Node.js, and scaling infrastructure for millions of users.',
        experience: [
            {
                id: 1,
                company: 'Global Tech Corp',
                position: 'Principal Engineer',
                startDate: '2021-03',
                endDate: 'Present',
                description: 'Leading the architecture for our global payment gateway processing $500M annually.',
                bullets: [
                    'Redesigned microservices architecture using Kubernetes, reducing latency by 45%.',
                    'Mentored a team of 15 senior developers across 3 timezones.'
                ]
            }
        ],
        education: [
            {
                id: 1,
                school: 'Stanford University',
                degree: 'M.S. in Computer Science',
                year: '2015'
            }
        ],
        skills: ['React', 'TypeScript', 'Node.js', 'Go', 'Kubernetes', 'AWS', 'System Design']
    });

    const handlePersonalInfoChange = (e) => {
        setResumeData({
            ...resumeData,
            personalInfo: {
                ...resumeData.personalInfo,
                [e.target.name]: e.target.value
            }
        });
    };

    const handleTemplateSelect = (tid) => {
        setResumeData({ ...resumeData, templateId: tid });
    };

    const generateAISummary = async () => {
        setIsGenerating(true);
        try {
            const data = await apiRequest('/ai/generate-summary', {
                method: 'POST',
                body: JSON.stringify({
                    jobTitle: resumeData.personalInfo.jobTitle,
                    skills: resumeData.skills,
                    experience: resumeData.experience
                })
            });
            setResumeData({
                ...resumeData,
                summary: data.summary
            });
        } catch (err) {
            console.error('AI Error:', err);
            alert('Failed to generate AI summary. Please check your connection or API key.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        try {
            if (id === 'new') {
                const newResume = await resumeService.create(resumeData);
                navigate(`/editor/${newResume._id}`, { replace: true });
            } else {
                await resumeService.update(id, resumeData);
            }
            alert('Resume saved successfully!');
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save resume.');
        }
    };

    const handleDownload = async () => {
        const element = document.querySelector('.resume-paper');
        if (!element) return;
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${resumeData.personalInfo.fullName || 'resume'}.pdf`);
        } catch (err) {
            console.error('PDF Generation Error:', err);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const handleShare = () => {
        if (!id) {
            alert('Please save your resume first before sharing!');
            return;
        }
        const shareUrl = `${window.location.origin}/view/${id}`;
        navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
    };

    return (
        <div className="editor-container">
            <header className="editor-header glass">
                <div className="header-left">
                    <button onClick={() => navigate('/dashboard')}><FaChevronLeft /> Back</button>
                    <div className="vertical-divider"></div>
                    <img src={logo} alt="Logo" className="header-logo" />
                    <input 
                        type="text" 
                        value={resumeData.title} 
                        onChange={(e) => setResumeData({...resumeData, title: e.target.value})}
                    />
                </div>
                <div className="header-right">
                    <div className="strength-meter">
                        <span className="meter-label">Strength</span>
                        <div className="meter-bar">
                            <div className="meter-fill"></div>
                        </div>
                        <span className="meter-value">75%</span>
                    </div>
                    <button className="secondary-cta" style={{ marginRight: '12px', padding: '10px 20px', borderRadius: '30px' }} onClick={handleSave}>Save Changes</button>
                    <button className="primary-btn" style={{ marginRight: '12px' }} onClick={handleShare}>Share Link</button>
                    <button className="primary-btn" onClick={handleDownload}><FaDownload /> Export PDF</button>
                </div>
            </header>

            <div className="editor-main">
                <aside className="editor-sidebar glass">
                    <h4>Design</h4>
                    <button className={activeSection === 'templates' ? 'active' : ''} onClick={() => setActiveSection('templates')}>
                        <FaLayerGroup size={14} /> Templates
                    </button>
                    <h4>Content</h4>
                    <button className={activeSection === 'personal' ? 'active' : ''} onClick={() => setActiveSection('personal')}>
                        <FaUser size={14} /> Personal Info
                    </button>
                    <button className={activeSection === 'summary' ? 'active' : ''} onClick={() => setActiveSection('summary')}>
                        <FaQuoteLeft size={14} /> Summary
                    </button>
                    <button className={activeSection === 'experience' ? 'active' : ''} onClick={() => setActiveSection('experience')}>
                        <FaBriefcase size={14} /> Experience
                    </button>
                    <button className={activeSection === 'education' ? 'active' : ''} onClick={() => setActiveSection('education')}>
                        <FaGraduationCap size={14} /> Education
                    </button>
                    <button className={activeSection === 'skills' ? 'active' : ''} onClick={() => setActiveSection('skills')}>
                        <FaTools size={14} /> Skills
                    </button>
                </aside>

                <div className="editor-form-container glass">
                    {activeSection === 'templates' && (
                        <TemplateSelector 
                            current={resumeData.templateId} 
                            onSelect={handleTemplateSelect} 
                        />
                    )}
                    {activeSection === 'personal' && (
                        <section className="form-section">
                            <div className="form-section-header">
                                <h2>Personal Details</h2>
                                <p>Essential information for recruiters to reach you.</p>
                            </div>
                            <div className="input-grid">
                                <div className="input-field">
                                    <label>Full Name</label>
                                    <input name="fullName" value={resumeData.personalInfo.fullName} onChange={handlePersonalInfoChange} />
                                </div>
                                <div className="input-field">
                                    <label>Professional Title</label>
                                    <input name="jobTitle" value={resumeData.personalInfo.jobTitle} onChange={handlePersonalInfoChange} />
                                </div>
                                <div className="input-field">
                                    <label>Email Address</label>
                                    <input name="email" value={resumeData.personalInfo.email} onChange={handlePersonalInfoChange} />
                                </div>
                                <div className="input-field">
                                    <label>Phone Number</label>
                                    <input name="phone" value={resumeData.personalInfo.phone} onChange={handlePersonalInfoChange} />
                                </div>
                                <div className="input-field" style={{ gridColumn: 'span 2' }}>
                                    <label>Profile Photo URL</label>
                                    <input name="photo" value={resumeData.personalInfo.photo} onChange={handlePersonalInfoChange} placeholder="Paste an image URL here..." />
                                </div>
                                <div className="input-field" style={{ gridColumn: 'span 2' }}>
                                    <label>Location</label>
                                    <input name="location" value={resumeData.personalInfo.location} onChange={handlePersonalInfoChange} />
                                </div>
                            </div>
                        </section>
                    )}
                    {activeSection === 'summary' && (
                        <section className="form-section">
                            <div className="form-section-header">
                                <h2>Professional Summary</h2>
                                <p>Highlight your top achievements and skills.</p>
                            </div>
                            <div className="input-field">
                                <div className="label-with-ai" style={{ marginBottom: '12px' }}>
                                    <label>Career Summary</label>
                                    <button className="ai-btn" onClick={generateAISummary} disabled={isGenerating}>
                                        {isGenerating ? 'Enhancing...' : <><FaMagic /> AI Rewrite</>}
                                    </button>
                                </div>
                                <textarea 
                                    rows="10" 
                                    value={resumeData.summary} 
                                    onChange={(e) => setResumeData({...resumeData, summary: e.target.value})}
                                />
                            </div>
                        </section>
                    )}
                    {activeSection === 'experience' && (
                        <section className="form-section">
                            <div className="form-section-header">
                                <h2>Work Experience</h2>
                                <p>Detail your professional journey.</p>
                                <button className="add-btn" onClick={() => {
                                    const newExp = { id: Date.now(), company: '', position: '', startDate: '', endDate: '', description: '', bullets: [] };
                                    setResumeData({ ...resumeData, experience: [...resumeData.experience, newExp] });
                                }}>+ Add Experience</button>
                            </div>
                            {resumeData.experience.map((exp, index) => (
                                <div key={exp.id} className="experience-item glass">
                                    <div className="input-grid">
                                        <div className="input-field">
                                            <label>Company</label>
                                            <input value={exp.company} onChange={(e) => {
                                                const newExp = [...resumeData.experience];
                                                newExp[index].company = e.target.value;
                                                setResumeData({ ...resumeData, experience: newExp });
                                            }} />
                                        </div>
                                        <div className="input-field">
                                            <label>Position</label>
                                            <input value={exp.position} onChange={(e) => {
                                                const newExp = [...resumeData.experience];
                                                newExp[index].position = e.target.value;
                                                setResumeData({ ...resumeData, experience: newExp });
                                            }} />
                                        </div>
                                        <div className="input-field">
                                            <label>Start Date</label>
                                            <input type="month" value={exp.startDate} onChange={(e) => {
                                                const newExp = [...resumeData.experience];
                                                newExp[index].startDate = e.target.value;
                                                setResumeData({ ...resumeData, experience: newExp });
                                            }} />
                                        </div>
                                        <div className="input-field">
                                            <label>End Date</label>
                                            <input type="month" value={exp.endDate} onChange={(e) => {
                                                const newExp = [...resumeData.experience];
                                                newExp[index].endDate = e.target.value;
                                                setResumeData({ ...resumeData, experience: newExp });
                                            }} />
                                        </div>
                                    </div>
                                    <button className="delete-btn" onClick={() => {
                                        const newExp = resumeData.experience.filter((_, i) => i !== index);
                                        setResumeData({ ...resumeData, experience: newExp });
                                    }}>Remove</button>
                                </div>
                            ))}
                        </section>
                    )}
                    {activeSection === 'education' && (
                        <section className="form-section">
                            <div className="form-section-header">
                                <h2>Education</h2>
                                <p>Your academic background.</p>
                                <button className="add-btn" onClick={() => {
                                    const newEdu = { id: Date.now(), school: '', degree: '', year: '' };
                                    setResumeData({ ...resumeData, education: [...resumeData.education, newEdu] });
                                }}>+ Add Education</button>
                            </div>
                            {resumeData.education.map((edu, index) => (
                                <div key={edu.id} className="experience-item glass">
                                    <div className="input-grid">
                                        <div className="input-field" style={{ gridColumn: 'span 2' }}>
                                            <label>School / University</label>
                                            <input value={edu.school} onChange={(e) => {
                                                const newEdu = [...resumeData.education];
                                                newEdu[index].school = e.target.value;
                                                setResumeData({ ...resumeData, education: newEdu });
                                            }} />
                                        </div>
                                        <div className="input-field">
                                            <label>Degree</label>
                                            <input value={edu.degree} onChange={(e) => {
                                                const newEdu = [...resumeData.education];
                                                newEdu[index].degree = e.target.value;
                                                setResumeData({ ...resumeData, education: newEdu });
                                            }} />
                                        </div>
                                        <div className="input-field">
                                            <label>Year</label>
                                            <input value={edu.year} onChange={(e) => {
                                                const newEdu = [...resumeData.education];
                                                newEdu[index].year = e.target.value;
                                                setResumeData({ ...resumeData, education: newEdu });
                                            }} />
                                        </div>
                                    </div>
                                    <button className="delete-btn" onClick={() => {
                                        const newEdu = resumeData.education.filter((_, i) => i !== index);
                                        setResumeData({ ...resumeData, education: newEdu });
                                    }}>Remove</button>
                                </div>
                            ))}
                        </section>
                    )}
                    {activeSection === 'skills' && (
                        <section className="form-section">
                            <div className="form-section-header">
                                <h2>Skills</h2>
                                <p>Highlight your technical expertise.</p>
                            </div>
                            <div className="skills-input-container">
                                <input 
                                    placeholder="e.g. React, Node.js, Python (Press Enter to add)" 
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.target.value.trim()) {
                                            setResumeData({
                                                ...resumeData,
                                                skills: [...resumeData.skills, e.target.value.trim()]
                                            });
                                            e.target.value = '';
                                        }
                                    }}
                                />
                                <div className="skills-tags">
                                    {resumeData.skills.map((skill, index) => (
                                        <span key={index} className="skill-tag">
                                            {skill}
                                            <button onClick={() => {
                                                const newSkills = resumeData.skills.filter((_, i) => i !== index);
                                                setResumeData({ ...resumeData, skills: newSkills });
                                            }}>×</button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                </div>
                <div className="editor-preview-panel">
                    <ResumePreview data={resumeData} />
                </div>
            </div>
            <AIAssistant data={resumeData} onUpdate={setResumeData} />
        </div>
    );
};

export default Editor;
