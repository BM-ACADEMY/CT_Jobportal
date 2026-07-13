const checkPriorityBadge = (user) => {
  if (!user) return false;
  
  let isPriority = false;
  let limit = 0;
  let source = null;

  let plan = user.subscription;

  if (user.subscriptionDetails) {
    const details = user.subscriptionDetails;
    const expiry = user.subscriptionExpiry;
    const isSnapshotValid = details.price === 0 || details.duration === 'Lifetime' || !expiry || new Date(expiry) > new Date();
    if (isSnapshotValid) {
      plan = details;
    }
  }
  
  if (plan && plan.hasPriorityBadge) {
    isPriority = true;
    source = 'plan';
    limit = 0;
  } else if (plan && Array.isArray(plan.features)) {
    const dynamicFeature = plan.features.find(f => f.isActive && (f.name?.toLowerCase() === 'priority badge' || f.name?.toLowerCase() === 'priority application badge'));
    if (dynamicFeature) {
      isPriority = true;
      source = 'plan';
      limit = parseInt(dynamicFeature.value) || 0;
    }
  }

  if (source === 'plan' && limit > 0) {
    if ((user.priorityApplicationsUsed || 0) >= limit) {
      isPriority = false;
    }
  }

  if (!isPriority && Array.isArray(user.purchasedFeatures)) {
    const ppFeatureIndex = user.purchasedFeatures.findIndex(f => 
      f.isActive && 
      f.featureKey === 'hasPriorityBadge' && 
      f.usageLeft > 0 && 
      (!f.expiresAt || new Date(f.expiresAt) > new Date())
    );
    
    if (ppFeatureIndex !== -1) {
      isPriority = true;
    }
  }

  return isPriority;
};

module.exports = checkPriorityBadge;
