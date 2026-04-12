import { useState } from 'react';

export default function DashboardSection({ isActive, urlHistory, emailHistory }) {
  const [showAllUrls, setShowAllUrls] = useState(false);
  const [showAllEmails, setShowAllEmails] = useState(false);

  if (!isActive) return null;

  const formatWhen = (ts) => new Date(ts).toLocaleString();

  const displayedUrls = showAllUrls ? urlHistory : urlHistory.slice(0, 7);
  const displayedEmails = showAllEmails ? emailHistory : emailHistory.slice(0, 7);

  return (
    <section id="dashboard" className="section section--active">
      <div className="container">
        <h2 className="section__title">Dashboard & History</h2>

        <div className="history">
          <div className="history__block">
            <h3>Last Scanned URLs</h3>
            <div className="table">
              <div className="table__head">
                <div>URL</div>
                <div>Status</div>
                <div>When</div>
              </div>
              <div className="table__body">
                {displayedUrls.map((item, idx) => {
                  const isSafe = item.verdict?.safe;
                  const status = isSafe ? 'Safe' : 'Phishing';
                  const statusCls = isSafe ? 'badge badge--success' : 'badge badge--danger';
                  const riskInfo = item.verdict?.riskScore ? ` (${item.verdict.riskScore}/100)` : '';
                  const riskLevel = item.verdict?.riskLevel ? ` [${item.verdict.riskLevel}]` : '';

                  return (
                    <div key={idx} className="table__row">
                      <div className="url">{item.url}</div>
                      <div>
                        <span className={statusCls}>{status}{riskInfo}{riskLevel}</span>
                      </div>
                      <div>{formatWhen(item.ts)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            {urlHistory.length > 7 && (
              <button 
                className="btn btn--secondary" 
                style={{ marginTop: '14px', width: '100%' }} 
                onClick={() => setShowAllUrls(!showAllUrls)}
              >
                {showAllUrls ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>

          <div className="history__block">
            <h3>Last Checked Emails</h3>
            <div className="table">
              <div className="table__head">
                <div>Email</div>
                <div>Status</div>
                <div>When</div>
              </div>
              <div className="table__body">
                {displayedEmails.map((item, idx) => {
                  const isBreached = item.breached;
                  const status = isBreached ? 'Found in leaks' : 'Not found';
                  const statusCls = isBreached ? 'badge badge--danger' : 'badge badge--success';
                  const riskInfo = item.riskScore ? ` (${item.riskScore}/100)` : '';
                  const riskLevel = item.riskLevel ? ` [${item.riskLevel}]` : '';

                  return (
                    <div key={idx} className="table__row">
                      <div>{item.email}</div>
                      <div>
                        <span className={statusCls}>{status}{riskInfo}{riskLevel}</span>
                      </div>
                      <div>{formatWhen(item.ts)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            {emailHistory.length > 7 && (
              <button 
                className="btn btn--secondary" 
                style={{ marginTop: '14px', width: '100%' }} 
                onClick={() => setShowAllEmails(!showAllEmails)}
              >
                {showAllEmails ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
