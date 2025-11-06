#!/usr/bin/env python3
from __future__ import annotations
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin


# Transformer to select & order columns for sklearn pipelines
class ColumnSelector(BaseEstimator, TransformerMixin):
    """
    Clone-safe column selector for sklearn pipelines.

    Selects and orders columns exactly as provided.
    Any missing columns during inference are created as 0.0
    to maintain consistent feature dimensions.

    Compatible with sklearn.clone() used in cross-validation
    and grid search.
    """

    def __init__(self, feature_names: list[str] | None = None):
        # Store params *as-is* — sklearn requires this for clone()
        self.feature_names = feature_names

    def fit(self, X, y=None):
        # Do not modify self.feature_names here (clone-safety)
        return self

    def transform(self, X):
        # Ensure DataFrame
        X_df = pd.DataFrame(X) if not isinstance(X, pd.DataFrame) else X.copy()

        # Use provided feature list, or infer all columns if None
        cols = self.feature_names if self.feature_names is not None else list(X_df.columns)

        # Add any missing columns to preserve model input shape
        for c in cols:
            if c not in X_df.columns:
                X_df[c] = 0.0

        # Return in correct order
        return X_df[cols]
