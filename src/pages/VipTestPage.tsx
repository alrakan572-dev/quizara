import { useVip } from "../hooks/useVip";

export function VipTestPage() {
  const {
    plans,
    isVip,
    loading,
    processing,
    buyPlan,
    cancelVip,
    refreshVip,
  } = useVip(123456789);

  if (loading) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        Loading VIP...
      </div>
    );
  }

  return (
    <div style={{ color: "white", padding: 20 }}>
      <h2>VIP Test Page</h2>

      <p>Status: {isVip ? "VIP Active ✅" : "Not VIP ❌"}</p>

      <button onClick={refreshVip} disabled={processing}>
        Refresh VIP Status
      </button>

      <br />
      <br />

      <button onClick={cancelVip} disabled={processing || !isVip}>
        Cancel VIP
      </button>

      <hr />

      <h3>VIP Plans</h3>

      {plans.map((plan) => (
        <div
          key={plan.id}
          style={{
            border: "1px solid gray",
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <h4>{plan.plan_name}</h4>
          <p>Duration: {plan.duration_days} days</p>
          <p>Price: {plan.price}</p>
          <p>Bonus: {plan.bonus_points_percent}%</p>
          <p>Lucky Boxes / Day: {plan.lucky_boxes_per_day}</p>

          <button
            onClick={() => buyPlan(plan.id)}
            disabled={processing}
          >
            Buy / Activate
          </button>
        </div>
      ))}
    </div>
  );
}