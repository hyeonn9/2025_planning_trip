import React, {useRef, useState} from "react";
import "./FeedbackModal.css";
import icon from "../../assets/images/icon.svg";
import regenerate from "../../assets/images/regenerate.svg"
import {AlertModal} from "./AlertModal";

// 지도 대신 화면 오른쪽에 피드백 내용을 띄움
const FeedbackModal = ({ onClose,tripId,feedbacks, loading, setFeedbacks, setLoadingFeedbacks, fetchTrip }) => {
  const alertShownRef = useRef(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertText, setAlertText] = useState("");
  const [alertType, setAlertType] = useState("warn");

    // 재정렬 요청 함수
  const handleReorder = async (day, distanceFeedback) => {
    try {
      const response = await fetch(`/schedule/${tripId}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          day: day, // DAY 번호
          distanceFeedback: distanceFeedback, // 동선 피드백 문자열
        }),
      });
      if (!response.ok) throw new Error("재정렬 요청 실패");
      fetchTrip(); // 최신 일정 데이터 가져오기

      if (!alertShownRef.current) {
        alertShownRef.current = true;
        setAlertText("일정이 추천 순서로 재정렬되었습니다!");
        setAlertOpen(true);
        setAlertType("success"); 
        setTimeout(() => {
          alertShownRef.current = false;
        }, 1000);
      }

      //window.location.reload(); // 화면 새로고침으로 업데이트 반영
    } catch (error) {
      console.error("재정렬 오류:", error);
      alert("재정렬에 실패했습니다.");
    }
  };
    
    const regeneratefeedback = async ()=>{
        setLoadingFeedbacks(true);
        try {
            const res = await fetch(`/feedback/${tripId}`);
            const data = await res.json();
            
            setFeedbacks(data.feedbacks);
        } catch (error) {
            console.error("피드백 불러오기 오류");
        } finally {
            setLoadingFeedbacks(false);
        }
    };

    return (
        // 모달 전체 영역 (바깥 클릭 시 onClose 실행)
        <div className="feedback-modal" onClick={onClose}>
        {/* 모달 내부 영역 (바깥 클릭 방지) */}
        <div className="feedback-box" onClick={(e) => e.stopPropagation()}>
            
            {/* 모달 상단 - 프로필 사진, 제목, 시간 표시 */}
            <div className="feedback-header">
                <div className="feedback-header-left">
                    <img src={icon} alt="profile" className="feedback-profile" />
                    <div className="feedback-title">slay support</div>
                </div>

                {/* 피드백 재생성 버튼 */}
                {!loading && (
                    <img src={regenerate} alt="피드백 재생" className="feedback-regenerate" onClick={regeneratefeedback} />
                )}

            </div>

            {loading ? (
                <>
                <div className="feedback-message">
                <p className="check-title">✨ 일정 체크 중!</p>
                <p className="check-desc">
                    AI가 당신의 여행 일정을 분석하고 있어요! 조금만 기다려주세요.<br />
                </p>
                </div>

                {/* Skeleton UI 3개 정도 보여주기 */}
                <div className="skeleton"></div>
                <div className="skeleton"></div>
                <div className="skeleton"></div>
                </>
            ) : (
                <div className="feedback-message">
                <p className="check-title">✨ 일정 체크 완료!</p>
                <p className="check-desc">
                    여행 일정, 한 번 더 꼼꼼히 확인해드릴게요!<br />
                    <strong>slay support</strong>가 당신의 계획을 똑똑하게 점검해드립니다!
                </p>
                </div>
            )}
    
            {feedbacks.map((item) => (
          <div key={item.day} className="feedback-bubble">
            <p className="bubble-label">💬 DAY {item.day} 일정 피드백이에요!</p>
            {typeof item.feedback === "string" ? (
              <p>{item.feedback}</p>
            ) : (
              <>
                <div className="feedback-block">
                  <p className="feedback-label">🗺️ 동선 피드백</p>
                  <p className="feedback-content">{item.feedback?.distance_feedback}</p>
                  <div className="feedback-btn-wrapper">
                    <button
                      className="feedback-btn black"
                      onClick={() => handleReorder(item.day, item.feedback.distance_feedback)}
                    >
                      추천 순서로 재정렬
                    </button>
                  </div>
                </div>
                        <hr />
                        <div className="feedback-block">
                            <p className="feedback-label">🔭 날씨 피드백</p>
                            
                            {item.feedback.weather_info?.some(rw => rw.summary.main?.includes("작년")) && (
                                <p style={{ fontSize: "0.9rem", color: "#777", marginBottom: "0.9rem", marginTop:"-0.1rem" }}>
                                ※ 날씨 예보는 최대 8일까지만 제공되어, 가장 가까운 관측소의 작년 날씨 데이터를 참고했어요.
                                </p>
                            )}

                            {Array.isArray(item.feedback.weather_info) &&
                            item.feedback.weather_info.map((regionWeather, idx) => (
                                <div key={idx} className="feedback-content">
                                {/* 장소들 + 지역명 */}
                                <p>📍 <b>{regionWeather.places.join(", ")} ({regionWeather.region})</b></p>

                                {/* 날씨요약 */}
                                {regionWeather.summary.main?.includes("작년") ? (
                                    <p>
                                    <b>최고 온도: {regionWeather.summary.maxTemp}</b> ｜ 
                                    <b style={{ marginLeft: "8px" }}>최저 온도: {regionWeather.summary.minTemp}</b> ｜ 
                                    <b style={{ marginLeft: "8px" }}>평균 습도: {regionWeather.summary.humidity}</b>
                                    </p>
                                ) : (
                                    <p>
                                    <b>{regionWeather.summary.main}</b> ｜ 
                                    <b style={{ marginLeft: "8px" }}>최고 온도: {regionWeather.summary.maxTemp}</b> ｜ 
                                    <b style={{ marginLeft: "8px" }}>최저 온도: {regionWeather.summary.minTemp}</b>
                                    </p>
                                )}
                                </div>
                            ))}

                            {/* Day별 전체 요약 피드백 */}
                            {item.feedback.weather_feedback && (
                            <p style={{ marginTop: "1rem" }}>👉 {item.feedback.weather_feedback}</p>
                            )}
                        </div>
                        <hr />
                        <div className="feedback-block">
                            <p className="feedback-label">⏰ 운영시간 피드백</p>
                            <p className="feedback-content">{item.feedback.operating_hours_feedback}</p>
                        </div>
                    </>
                    )}
                </div>
            ))}
            </div>

            {/* 경고 모달 */}
            {alertOpen && (
              <AlertModal text={alertText} type={alertType} onClose={() => setAlertOpen(false)} />
            )}
        </div>
    );
};

export default FeedbackModal;