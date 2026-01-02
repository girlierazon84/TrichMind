#!/usr/bin/env python3 === ml/common/column_selector.py

from __future__ import annotations

import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin


# pylint: disable=too-few-public-methods
class ColumnSelector(BaseEstimator, TransformerMixin):
    """
    Clone-safe column selector for sklearn pipelines.

    Selects and orders columns exactly as provided.
    Any missing columns during inference are created as 0.0
    to maintain consistent feature dimensions.
    """

    # pylint: disable=super-init-not-called
    def __init__(self, feature_names: list[str] | None = None):
        self.feature_names = feature_names

    # pylint: disable=unused-argument
    def fit(self, X, y=None):
        return self

    # pylint: disable=missing-function-docstring
    def transform(self, X):
        X_df = pd.DataFrame(X) if not isinstance(X, pd.DataFrame) else X.copy()
        cols = self.feature_names if self.feature_names is not None else list(X_df.columns)

        missing = [c for c in cols if c not in X_df.columns]
        if missing:
            X_df = pd.concat(
                [X_df, pd.DataFrame(0.0, index=X_df.index, columns=missing)],
                axis=1,
            )
        return X_df[cols]
