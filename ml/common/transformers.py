#!/usr/bin/env python3
from __future__ import annotations
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin


# Transformer to select & order columns
class ColumnSelector(BaseEstimator, TransformerMixin):
    """Selects & orders columns exactly as provided.
    Missing columns are created as 0.0 to keep inference robust.
    """
    def __init__(self, feature_names: list[str]):
        self.feature_names = list(feature_names)

    # Fit method (no-op)
    def fit(self, X, y=None):
        return self

    # Transform method
    def transform(self, X):
        X_df = pd.DataFrame(X) if not isinstance(X, pd.DataFrame) else X.copy()
        for c in self.feature_names:
            if c not in X_df.columns:
                X_df[c] = 0.0
        return X_df[self.feature_names]