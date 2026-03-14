import React from 'react';
import { Shield, Lock, EyeOff, FileText, Heart, CheckCircle } from 'lucide-react';

export default function PrivacyPanel() {
  return (
    <div className="privacy-panel">
      <div className="privacy-header">
        <div className="privacy-icon-large">
          <Shield size={48} />
        </div>
        <h2>Privacy & Confidentiality Commitment</h2>
        <p className="privacy-intro">
          This platform lets you <strong>control DNS for your devices</strong>: block or allow websites per device. Your account, devices, and block/allow rules are stored so the service can apply your preferences. We do not sell your data.
        </p>
      </div>

      <div className="privacy-main">
        <div className="privacy-card primary">
          <div className="privacy-card-icon">
            <Lock size={28} />
          </div>
          <div className="privacy-card-content">
            <h3>Your Data is Protected</h3>
            <p>
              We store only what is needed to run the service: <strong>account details</strong> (name, email, password hash), <strong>devices</strong> you add and their secure tokens, and <strong>block/allow rules</strong> you set. We may optionally log DNS query counts per device for statistics; we <strong>do not sell your data</strong>.
            </p>
          </div>
        </div>

        <div className="privacy-features">
          <h3 className="features-title">Our Privacy Promise</h3>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <EyeOff size={24} />
              </div>
              <h4>No Data Collection</h4>
              <p>We don't track, collect, or store your personal information</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <Shield size={24} />
              </div>
              <h4>Complete Privacy</h4>
              <p>Your data remains private and confidential at all times</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <FileText size={24} />
              </div>
              <h4>Open Source</h4>
              <p>This is an open-source project - transparent and trustworthy</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <Heart size={24} />
              </div>
              <h4>Your Control</h4>
              <p>You decide which sites to block or allow per device; you can revoke a device at any time</p>
            </div>
          </div>
        </div>

        <div className="privacy-guarantee">
          <div className="guarantee-content">
            <CheckCircle size={32} className="guarantee-icon" />
            <div className="guarantee-text">
              <h3>Enjoy Complete Peace of Mind</h3>
              <p>
                Use DNS control with peace of mind. We keep only the data needed to provide the service and do not sell or share it with third parties for marketing.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .privacy-panel {
          display: grid;
          gap: 2.5rem;
        }
        .privacy-header {
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }
        .privacy-icon-large {
          width: 5rem;
          height: 5rem;
          border-radius: 1.5rem;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.3);
        }
        .privacy-header h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .privacy-intro {
          color: #64748b;
          font-size: 1.1rem;
          line-height: 1.7;
          margin: 0;
        }
        .privacy-intro strong {
          color: #1d4ed8;
          font-weight: 600;
        }
        .privacy-main {
          display: grid;
          gap: 2rem;
        }
        .privacy-card {
          background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
          border: 2px solid #3b82f6;
          border-radius: 1.5rem;
          padding: 2rem;
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }
        .privacy-card-icon {
          width: 4rem;
          height: 4rem;
          border-radius: 1rem;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 8px 16px rgba(37, 99, 235, 0.3);
        }
        .privacy-card-content {
          flex: 1;
        }
        .privacy-card-content h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.75rem 0;
        }
        .privacy-card-content p {
          color: #475569;
          font-size: 1rem;
          line-height: 1.7;
          margin: 0;
        }
        .privacy-card-content strong {
          color: #1d4ed8;
          font-weight: 600;
        }
        .privacy-features {
          margin-top: 1rem;
        }
        .features-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 1.5rem;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.25rem;
        }
        .feature-item {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          transition: all 0.3s ease;
        }
        .feature-item:hover {
          border-color: #3b82f6;
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.15);
          transform: translateY(-4px);
        }
        .feature-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
        }
        .feature-item h4 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }
        .feature-item p {
          color: #64748b;
          font-size: 0.9rem;
          line-height: 1.6;
          margin: 0;
        }
        .privacy-guarantee {
          margin-top: 1rem;
        }
        .guarantee-content {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 2px solid #10b981;
          border-radius: 1.5rem;
          padding: 2rem;
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }
        .guarantee-icon {
          color: #10b981;
          flex-shrink: 0;
        }
        .guarantee-text {
          flex: 1;
        }
        .guarantee-text h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.75rem 0;
        }
        .guarantee-text p {
          color: #475569;
          font-size: 1rem;
          line-height: 1.7;
          margin: 0;
        }
        @media (max-width: 768px) {
          .privacy-header h2 {
            font-size: 1.75rem;
          }
          .privacy-card {
            flex-direction: column;
            padding: 1.5rem;
          }
          .privacy-card-icon {
            width: 3.5rem;
            height: 3.5rem;
          }
          .features-grid {
            grid-template-columns: 1fr;
          }
          .guarantee-content {
            flex-direction: column;
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

